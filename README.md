# 🧠 ContextEngine

**ContextEngine** es una API backend que implementa un sistema de *Retrieval-Augmented Generation (RAG)* para consultar documentos mediante búsqueda semántica y modelos de lenguaje.

Permite:

* Ingestar documentos
* Generar embeddings
* Realizar búsquedas semánticas
* Responder preguntas usando contexto relevante

---

## 🚀 Features

* 📄 Ingesta de documentos (texto)
* 🔢 Generación de embeddings (Google Gemini)
* 🔍 Búsqueda semántica (cosine similarity)
* 🤖 Generación de respuestas con LLM
* 🗄️ Persistencia simple en JSON (MVP)

---

## 🧠 ¿Cómo funciona?

El sistema sigue el flujo RAG:

1. **Ingesta**

   * Se recibe un documento
   * Se divide en chunks
   * Se generan embeddings
   * Se almacenan en JSON

2. **Consulta**

   * Se recibe una pregunta
   * Se convierte en embedding
   * Se buscan los chunks más similares
   * Se construye un contexto
   * El LLM genera una respuesta basada en ese contexto


---

## ⚙️ Instalación

```bash
git clone https://github.com/tu-usuario/context-engine.git
cd context-engine
npm install
```

---

## 🔐 Variables de entorno

Crear un archivo `.env` en la raíz:

```
PORT=3000
GEMINI_API_KEY=tu_api_key
```

---

## ▶️ Ejecutar el proyecto

```bash
npm run dev
```

---

## 📡 Endpoints

### 📥 Ingestar documento

**POST** `/api/documents`

```json
{
  "text": "Contenido del documento..."
}
```

---

### ❓ Consultar documentos

**POST** `/api/query`

```json
{
  "question": "¿De qué trata el documento?"
}
```

#### Respuesta:

```json
{
  "answer": "El documento trata sobre...",
  "sources": [
    {
      "text": "...",
      "score": 0.54
    }
  ]
}
```

---

### ❤️ Health check

**GET** `/api/health`

---


## 🧩 Tecnologías utilizadas

* Node.js
* Express
* Google Gemini API
* Embeddings
* Cosine Similarity

---

## 📌 Estado del proyecto

MVP funcional con:

* Pipeline completo de RAG
* Persistencia local
* Integración con modelo de embeddings y LLM


---

## 💡 Sobre el proyecto

Este proyecto fue desarrollado como práctica de integración de IA en backend, demostrando:

* Uso de embeddings
* Implementación de RAG
* Diseño modular de servicios
* Integración con APIs de IA
