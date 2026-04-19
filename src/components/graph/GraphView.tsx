import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { getCategoryClass } from '../../lib/utils';
import { FileEntry } from '../../lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Clock, ExternalLink, X, FileText, 
  Sparkles, Brain, Share2, Search, Check, Folder
} from 'lucide-react';
import { summarizeFile, openFile, getFileRelationships } from '../../lib/tauri';

// ─── Custom Node Components ──────────────────────────────────────────

const FileNode = ({ data, selected }: { data: { file: FileEntry }, selected?: boolean }) => {
  const catClass = getCategoryClass(data.file.category);
  const isDir = data.file.is_dir;

  return (
    <div className={`
      px-5 py-4 glass border transition-all duration-300 w-[240px] relative
      ${selected 
        ? 'border-cv-accent glow-accent scale-105 z-50' 
        : 'border-cv-border-bright hover:border-cv-accent/50'}
      ${isDir ? 'border-cv-accent/40 bg-cv-accent/5' : catClass}
    `}>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-cv-accent !border-none" />
      
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
           <div className={`text-[9px] uppercase font-black tracking-[0.2em] mb-1 ${isDir ? 'text-cv-accent-light' : 'text-cv-accent-light'}`}>
             {isDir ? 'Folder' : data.file.category}
           </div>
           {isDir ? <Folder size={12} className="text-cv-accent-light" /> : selected && <Sparkles size={10} className="text-cv-accent-light animate-pulse" />}
        </div>
        <div className={`text-sm font-bold truncate font-heading uppercase tracking-wide leading-tight ${isDir ? 'text-white' : 'text-cv-text'}`}>
          {data.file.name}
        </div>
        <div className="text-[9px] text-cv-text-muted font-mono mt-1 flex items-center gap-2">
          <span className="opacity-50">PATH:</span>
          <span className="truncate opacity-80">{data.file.path.split(/[/\\]/).slice(-2).join('/')}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-cv-accent !border-none" />
    </div>
  );
};

const nodeTypes = {
  fileNode: FileNode,
};

type LayoutMode = 'timeline' | 'category' | 'semantic';

export function GraphView() {
  const { clusters, isLoading, loadTimeline } = useFileStore();
  const { searchQuery } = useUIStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('semantic');
  const [sensitivity, setSensitivity] = useState(25);
  const [minMatch, setMinMatch] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showRecursive, setShowRecursive] = useState(false);
  const [recursiveFiles, setRecursiveFiles] = useState<FileEntry[]>([]);

  useEffect(() => {
    if (clusters.length === 0 && !isLoading) {
      loadTimeline();
    }
  }, [clusters.length, isLoading, loadTimeline]);

  // Highlight matching nodes based on search query
  useEffect(() => {
    if (!searchQuery) {
        setNodes(nds => nds.map(n => ({ ...n, style: { ...n.style, opacity: 1, filter: 'none' } })));
        return;
    }
    const q = searchQuery.toLowerCase();
    setNodes(nds => nds.map(n => {
        const fileData = n.data?.file as FileEntry | undefined;
        const isMatch = fileData?.name?.toLowerCase().includes(q) || 
                        fileData?.category?.toLowerCase().includes(q) ||
                        (typeof n.data?.label === 'string' && (n.data.label as string).toLowerCase().includes(q));
        return {
            ...n,
            style: { 
                ...n.style, 
                opacity: isMatch ? 1 : 0.2,
                filter: isMatch ? 'brightness(1.2) drop-shadow(0 0 10px var(--color-cv-accent))' : 'grayscale(0.8) blur(1px)'
            }
        };
    }));
  }, [searchQuery, setNodes]);

  // Reset AI summary when the active selection changes
  useEffect(() => {
    setSummary(null);
  }, [selectedFile]);

  // Live Filtering of Edges based on match percentage
  useEffect(() => {
    setEdges((eds) => 
      eds.map((e) => ({
        ...e,
        hidden: (e.data?.matchPercent as number | undefined) !== undefined && (e.data?.matchPercent as number) < minMatch
      }))
    );
  }, [minMatch, setEdges]);

  // Fetch all files for recursive mode
  useEffect(() => {
    if (showRecursive) {
      import('../../lib/tauri').then(({ getAllFiles }) => {
        getAllFiles().then(setRecursiveFiles).catch(console.error);
      });
    }
  }, [showRecursive]);

  const { searchResults } = useUIStore();

  const allFiles = useMemo(() => {
    let baseFiles: FileEntry[] = [];
    if (showRecursive) {
      baseFiles = recursiveFiles;
    } else {
      baseFiles = clusters.flatMap(c => c.files);
    }

    if (searchQuery && searchResults.length > 0) {
      const combined = [...baseFiles];
      searchResults.forEach(res => {
        if (!baseFiles.some(f => f.path === res.path)) {
          combined.push(res);
        }
      });
      return combined;
    }

    return baseFiles;
  }, [clusters, showRecursive, recursiveFiles, searchQuery, searchResults]);

  /**
   * Orchestrates the visual layout based on the active mode (Semantic, Timeline, or Category).
   */
  const generateLayout = useCallback(async () => {
    if (clusters.length === 0) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    if (layoutMode === 'semantic') {
        // ─── Semantic Knowledge Map ──────────────────────────────────
        setIsAnalyzing(true);
        setAnalysisProgress(10);
        
        try {
            // Fake progress simulator for better UX during calculation
            const steps = [
              { p: 30, text: "Scanning Vector DB..." },
              { p: 60, text: "Calculating Neural Weights..." },
              { p: 90, text: "Establishing Links..." }
            ];
            
            for (const step of steps) {
               setAnalysisProgress(step.p);
               await new Promise(r => setTimeout(r, 400));
            }

            const relationships = await getFileRelationships(sensitivity / 100);
            setAnalysisProgress(100);
            await new Promise(r => setTimeout(r, 200));
            
            // Node Placement (Expansive Spiral Layout for better overview)
            allFiles.forEach((file, idx) => {
                const angle = 1.2 * idx; // Angle offset to prevent overlap
                const radius = 150 + 180 * Math.sqrt(idx); // Incremental distance
                newNodes.push({
                    id: file.path,
                    type: 'fileNode',
                    position: { 
                        x: Math.cos(angle) * (radius + (idx % 2 * 100)), // Added jitter for natural feel
                        y: Math.sin(angle) * (radius + (idx % 2 * 100)) 
                    },
                    data: { file },
                });
            });

            // 1. Structural Connections (Folder Hierarchy)
            allFiles.forEach((file) => {
               const parts = file.path.split(/[/\\]/);
               if (parts.length > 1) {
                  const parentPath = parts.slice(0, -1).join('\\'); // Windows Path fallback
                  // Check if parent node exists in current set
                  if (allFiles.some(f => f.path === parentPath)) {
                      newEdges.push({
                        id: `struct-${file.path}`,
                        source: parentPath,
                        target: file.path,
                        type: 'smoothstep',
                        label: 'Contains',
                        labelStyle: { fill: '#64748b', fontSize: 6, opacity: 0.5 },
                        style: { stroke: 'rgba(100, 116, 139, 0.4)', strokeWidth: 1.5, strokeDasharray: '2,2' },
                        markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(100, 116, 139, 0.4)', width: 8, height: 8 }
                      });
                  }
               }
            });

            // 2. Semantic Connections (Intelligent Styling based on Match Rate)
            relationships.forEach((rel, idx) => {
                const strength = 1 - rel.distance;
                const matchPercent = Math.round(strength * 100);
                
                // Tier-based styling for edge relevance
                let strokeColor = 'rgba(148, 163, 184, 0.1)'; 
                let strokeWidth = 1.2;
                let strokeDasharray = '6,6';
                let isAnimated = false;
                let opacity = 0.2;

                if (matchPercent >= 95) {
                    strokeColor = '#ff007f'; // Hyper Pink Glow
                    strokeWidth = 8;
                    strokeDasharray = '0';
                    isAnimated = true;
                    opacity = 1;
                } else if (matchPercent >= 80) {
                    strokeColor = '#a855f7'; // Cyber Purple
                    strokeWidth = 4.5;
                    strokeDasharray = '0';
                    isAnimated = true;
                    opacity = 0.9;
                } else if (matchPercent >= 60) {
                    strokeColor = '#00f2ff'; // Electric Cyan
                    strokeWidth = 2.5;
                    strokeDasharray = '0';
                    opacity = 0.7;
                } else if (matchPercent >= 40) {
                    strokeColor = 'rgba(148, 163, 184, 0.4)';
                    strokeWidth = 1.5;
                    strokeDasharray = '4,4';
                    opacity = 0.4;
                }

                newEdges.push({
                    id: `rel-${idx}`,
                    source: rel.source,
                    target: rel.target,
                    type: 'smoothstep', 
                    label: `${matchPercent}%`,
                    labelStyle: { 
                      fill: matchPercent > 60 ? '#fff' : strokeColor, 
                      fontSize: matchPercent > 90 ? 8 : 6, 
                      fontWeight: '900', 
                    },
                    labelBgStyle: { fill: strokeColor, fillOpacity: 0.95 },
                    labelBgPadding: [4, 2],
                    labelBgBorderRadius: 2,
                    animated: isAnimated, 
                    style: { 
                        stroke: strokeColor, 
                        strokeWidth: strokeWidth,
                        strokeDasharray: strokeDasharray,
                        opacity: opacity,
                        filter: matchPercent > 90 ? `drop-shadow(0 0 12px ${strokeColor})` : 'none',
                    },
                    markerEnd: { 
                        type: MarkerType.ArrowClosed, 
                        color: strokeColor, 
                        width: matchPercent > 70 ? 15 : 10, 
                        height: matchPercent > 70 ? 15 : 10 
                    },
                    data: { matchPercent } // Data for real-time edge filtering
                });
            });

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (e) {
            console.error("Failed to load Semantic Map:", e);
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress(0);
        }
    } else if (layoutMode === 'timeline') {
      // ─── Timeline Layout ───────────────────────────────────────
      let yPos = 50;
      clusters.forEach((cluster, clusterIndex) => {
        const clusterNodeId = `cluster-${clusterIndex}`;
        newNodes.push({
          id: clusterNodeId,
          position: { x: 140, y: yPos },
          data: { label: cluster.label },
          style: {
            background: 'var(--color-cv-accent)',
            color: '#000',
            border: 'none',
            padding: '12px 32px',
            fontWeight: '900',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '18px',
            width: 250,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          },
        });

        const rowCount = Math.ceil(cluster.files.length / 3);
        cluster.files.forEach((file, fileIndex) => {
          const fileNodeId = file.path;
          const col = fileIndex % 3;
          const row = Math.floor(fileIndex / 3);

          newNodes.push({
            id: fileNodeId,
            type: 'fileNode',
            position: { x: (col * 300) - 160, y: yPos + 180 + (row * 140) },
            data: { file },
          });

          newEdges.push({
            id: `e-${clusterNodeId}-${fileNodeId}`,
            source: clusterNodeId,
            target: fileNodeId,
            style: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
          });
        });
        yPos += 200 + (rowCount * 140) + 150;
      });
    } else {
      // ─── Category Layout ───────────────────────────────────────
      const categories = Array.from(new Set(allFiles.map(f => f.category)));
      let xPos = 0;
      categories.forEach((cat) => {
        const catNodeId = `cat-${cat}`;
        newNodes.push({
          id: catNodeId,
          position: { x: xPos, y: 0 },
          data: { label: cat.toUpperCase() },
          style: {
            background: 'transparent',
            color: '#fff',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            padding: '15px 40px',
            fontWeight: '900',
            fontFamily: "'Outfit', sans-serif",
            width: 200,
            textAlign: 'center',
            fontSize: '14px',
            letterSpacing: '0.2em'
          },
        });

        const catFiles = allFiles.filter(f => f.category === cat);
        catFiles.forEach((file, idx) => {
          const fileNodeId = file.path;
          newNodes.push({
            id: fileNodeId,
            type: 'fileNode',
            position: { x: xPos - 20, y: 180 + (idx * 130) },
            data: { file },
          });

          newEdges.push({
            id: `e-${catNodeId}-${fileNodeId}`,
            source: catNodeId,
            target: fileNodeId,
            style: { stroke: 'rgba(255, 255, 255, 0.05)' },
          });
        });
        xPos += 350;
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [clusters, layoutMode, allFiles, setNodes, setEdges, sensitivity]);

  useEffect(() => {
    generateLayout();
  }, [generateLayout]);

  const onPaneClick = useCallback(() => setSelectedFile(null), []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.type === 'fileNode') {
      setSelectedFile(node.data.file as FileEntry);
    } else {
      setSelectedFile(null);
    }
  }, []);

  const handleOpenFile = async () => {
    if (!selectedFile) return;
    await openFile(selectedFile.path);
  };

  const handleSummarize = async () => {
    if (!selectedFile) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeFile(selectedFile.path);
      setSummary(result);
    } catch (e) {
      console.error('AI Summarization failed:', e);
      setSummary(`Error: ${String(e)}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading && clusters.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-cv-accent border-t-transparent animate-spin" />
          <p className="text-cv-accent-light animate-pulse font-heading font-black text-xl tracking-[0.3em] uppercase">Initializing Neural Network...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 relative flex overflow-hidden bg-cv-bg"
    >
      {/* ─── React Flow Canvas ───────────────────────────────────── */}
      <div className="flex-1 relative h-full bg-cv-bg-secondary/10 border-r border-cv-border-subtle">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          minZoom={0.05}
          maxZoom={1.5}
          defaultEdgeOptions={{ 
            type: 'smoothstep',
            style: { stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 } 
          }}
        >
          <Background color="#111422" gap={40} size={1} />
          
          <Panel position="top-left" className="flex flex-col gap-3 m-4">
            <div className="flex flex-col gap-2">
              <div className="glass shadow-2xl border border-cv-border-bright flex items-center p-1">
                <button 
                  onClick={() => setLayoutMode('semantic')}
                  className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${layoutMode === 'semantic' ? 'bg-cv-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]' : 'text-cv-text-muted hover:text-white'}`}
                >
                  <Brain size={14} /> Knowledge Map
                </button>
                <button 
                  onClick={() => setLayoutMode('timeline')}
                  className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${layoutMode === 'timeline' ? 'bg-cv-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]' : 'text-cv-text-muted hover:text-white'}`}
                >
                  <Clock size={14} /> Timeline
                </button>
                <button 
                  onClick={() => setLayoutMode('category')}
                  className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${layoutMode === 'category' ? 'bg-cv-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]' : 'text-cv-text-muted hover:text-white'}`}
                >
                  <LayoutGrid size={14} /> Cluster
                </button>
              </div>
            </div>
          </Panel>

          <MiniMap 
            className="!bg-cv-bg !border-cv-border shadow-2xl !m-6" 
            maskColor="rgba(0,0,0,0.6)"
            nodeColor={(n) => {
              if (n.type === 'fileNode') return '#8b5cf6';
              return '#111422';
            }}
          />
          <Controls className="bg-cv-bg border-cv-border !shadow-none m-6" />
        </ReactFlow>
      </div>

      {/* ─── Neural Link Control Panel ───────────────────────────── */}
      <Panel position="top-right" className="m-4">
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="glass-strong p-6 border border-cv-border-bright w-72 flex flex-col gap-6 shadow-2xl relative z-[45]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Share2 size={18} className="text-cv-accent-light" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Neural Link Engine</h3>
          </div>
          
          <p className="text-[9px] text-cv-text-muted leading-relaxed uppercase font-bold">
            Discover hidden relationships between your files based on AI semantics.
          </p>

          <div className="space-y-4">
            {/* Recursive Toggle */}
            <div className="flex items-center justify-between p-3 bg-cv-bg-tertiary/30 border border-cv-border-subtle rounded-sm">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">Recursive</span>
                    <span className="text-[7px] text-cv-text-muted uppercase">Deep Scan</span>
                </div>
                <button 
                    onClick={() => setShowRecursive(!showRecursive)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${showRecursive ? 'bg-cv-accent shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-cv-bg-secondary border border-cv-border-subtle'}`}
                >
                    <motion.div 
                        animate={{ x: showRecursive ? 22 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                </button>
            </div>

            <div className="flex flex-col gap-1.5">
               <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                  <span className="text-cv-text-muted">Sensitivity</span>
                  <span className="text-cv-accent-light">{(100 - sensitivity).toFixed(0)}%</span>
               </div>
               <input 
                 type="range" 
                 min="5" max="80" 
                 disabled={isAnalyzing}
                 value={sensitivity} 
                 onChange={(e) => setSensitivity(parseInt(e.target.value))}
                 className="w-full accent-cv-accent bg-cv-bg-secondary h-1 cursor-pointer disabled:opacity-30"
               />
            </div>

            {isAnalyzing ? (
               <div className="space-y-3 py-2">
                  <div className="flex justify-between text-[8px] font-black text-cv-accent-light uppercase">
                    <span>{analysisProgress < 40 ? "Analyzing..." : analysisProgress < 80 ? "Linking..." : "Finalizing..."}</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-cv-bg-secondary border border-cv-border-subtle overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisProgress}%` }}
                      className="h-full bg-cv-accent glow-accent"
                    />
                  </div>
               </div>
            ) : (
               <button
                  onClick={() => {
                      setLayoutMode('semantic');
                      generateLayout();
                  }}
                  className="w-full py-3 bg-cv-accent text-white text-[10px] font-black uppercase tracking-widest glow-accent hover:bg-cv-accent-light transition-all flex items-center justify-center gap-2"
               >
                  <Brain size={14} />
                  Start Neural Scan
               </button>
            )}

            <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-cv-border-subtle/30">
               <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                  <span className="text-cv-text-muted">Live-Filter</span>
                  <span className="text-cv-accent-light">{minMatch}% Match</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={minMatch} 
                 onChange={(e) => setMinMatch(parseInt(e.target.value))}
                 className="w-full accent-cv-accent bg-cv-bg-secondary h-1 cursor-pointer"
               />
               <p className="text-[7px] text-cv-text-muted/60 uppercase text-center mt-1">Breathe life into only the strongest connections</p>
            </div>
          </div>
        </motion.div>
      </Panel>

      {/* ─── Detail Side Panel ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedFile && (
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-[380px] h-full glass border-l border-cv-border-bright p-8 overflow-y-auto flex flex-col gap-8 shadow-2xl z-30"
          >
            <div className="flex justify-between items-start">
              <div className={`w-16 h-16 flex items-center justify-center border border-cv-accent/30 bg-cv-accent/5`}>
                <FileText size={32} className="text-cv-accent-light" />
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-cv-surface transition-colors text-cv-text-muted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 bg-cv-accent animate-pulse" />
                 <span className="text-[10px] font-black text-cv-accent-light uppercase tracking-[0.3em]">Node Details</span>
              </div>
              <h3 className="text-3xl font-black text-white font-heading tracking-tighter break-words uppercase leading-[0.9]">
                {selectedFile.name}
              </h3>
            </div>

            <div className="space-y-6 flex-1">
              <div className="bg-cv-bg-secondary/40 border-l-2 border-cv-accent p-4 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-cv-text-muted uppercase tracking-widest">Metadata</span>
                  <span className="text-cv-accent-light font-mono">[{selectedFile.extension || 'FILE'}]</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-cv-text-muted uppercase font-black">Full Path</span>
                    <span className="text-white text-xs font-mono break-all opacity-80 leading-relaxed">{selectedFile.path}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2">
                    <span className="text-cv-text-muted uppercase font-black text-[8px]">Size</span>
                    <span className="text-white font-bold">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>

              {/* AI Intelligence Hub */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain size={16} className="text-cv-accent-light" />
                        <span className="text-[11px] text-white font-black uppercase tracking-widest italic">Intelligence</span>
                    </div>
                    {summary && <Check size={14} className="text-cv-success" />}
                </div>
                
                {summary ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-cv-text leading-relaxed p-5 bg-cv-accent/5 border border-cv-accent/20 italic font-medium relative"
                  >
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cv-accent/40" />
                    {summary}
                  </motion.div>
                ) : (
                  <button 
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="w-full py-4 border-2 border-cv-accent/40 text-cv-accent-light font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cv-accent hover:text-white transition-all duration-500 disabled:opacity-30 group"
                  >
                    {isSummarizing ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                         <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                         Generate AI Briefing
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Relations / Context */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <Share2 size={16} className="text-cv-info" />
                    <span className="text-[11px] text-white font-black uppercase tracking-widest italic">Semantic Context</span>
                 </div>
                 <div className="p-4 bg-cv-bg-tertiary/20 border border-cv-border-subtle text-[10px] text-cv-text-muted leading-relaxed">
                    This document is part of the knowledge graph. Connections represent semantic similarities based on file content.
                 </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button 
                onClick={handleOpenFile}
                className="w-full flex items-center justify-center gap-3 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:bg-cv-accent hover:text-white transition-all duration-500 shadow-xl"
              >
                <ExternalLink size={16} /> Open Document
              </button>
              <button 
                className="w-full flex items-center justify-center gap-3 py-3 border border-cv-border-bright text-cv-text-muted font-black uppercase tracking-[0.2em] text-[9px] hover:text-white transition-all"
              >
                <Search size={14} /> Reveal in Explorer
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
