use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct EmbedRequest {
    model: String,
    prompt: String,
}

#[derive(Deserialize)]
struct EmbedResponse {
    embedding: Vec<f32>,
}

pub async fn generate_embedding(text: &str) -> Result<Vec<f32>, Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::new();
    
    // We use the new /api/embeddings with prompt as input for older ollama, or /api/embed.
    // nomic-embed-text typically expects prompt.
    let req_body = EmbedRequest {
        model: "nomic-embed-text".to_string(),
        prompt: text.to_string(),
    };

    let res = client
        .post("http://localhost:11434/api/embeddings")
        .json(&req_body)
        .send()
        .await?;

    if res.status().is_success() {
        let parsed: EmbedResponse = res.json().await?;
        Ok(parsed.embedding)
    } else {
        Err(format!("Ollama API returned an error: {}", res.status()).into())
    }
}
#[derive(Serialize)]
struct GenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct GenerateResponse {
    response: String,
}

pub async fn generate_summary(text: &str) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::new();
    
    let prompt = format!("Du bist ein präziser Assistent für ChronoVault. Analysiere den Dateiinhalt und erstelle eine extrem kurze Zusammenfassung auf Deutsch (maximal 2-3 Sätze). Sei direkt und sachlich.\n\nInhalt:\n{}", text);

    let req_body = GenerateRequest {
        model: "llama3.2".to_string(),
        prompt,
        stream: false,
    };

    let res = client
        .post("http://localhost:11434/api/generate")
        .json(&req_body)
        .send()
        .await?;

    if res.status().is_success() {
        let parsed: GenerateResponse = res.json().await?;
        Ok(parsed.response.trim().to_string())
    } else {
        Err(format!("Ollama API returned an error: {}", res.status()).into())
    }
}
