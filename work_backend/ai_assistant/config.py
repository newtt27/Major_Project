from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:123456789@localhost:5432/db"
    OLLAMA_MODEL: str = "llama3:latest"
    OLLAMA_HOST: str = "http://localhost:11434"

    class Config:
        env_file = ".env"

settings = Settings()