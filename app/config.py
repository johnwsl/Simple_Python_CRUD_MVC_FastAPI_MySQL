"""Configurações da aplicação via variáveis de ambiente."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centraliza todas as configurações lidas do arquivo .env ou do ambiente.

    Atributos:
        mysql_host: Endereço do servidor MySQL (ex.: 'mysql' no Docker, 'localhost' local).
        mysql_port: Porta do MySQL (padrão 3306).
        mysql_user: Usuário de acesso ao banco.
        mysql_password: Senha do usuário MySQL.
        mysql_database: Nome do banco de dados.
        app_host: IP em que o Uvicorn escuta (0.0.0.0 = todas as interfaces).
        app_port: Porta HTTP da API (padrão 8000).
    """

    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "crud_user"
    mysql_password: str = "crud_password"
    mysql_database: str = "crud_db"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Lê variáveis do .env; ignora chaves extras não declaradas
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def database_url(self) -> str:
        """Monta a URL de conexão SQLAlchemy no formato mysql+pymysql://..."""
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )


# Instância única (singleton) usada em todo o projeto
settings = Settings()
