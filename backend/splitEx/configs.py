import os
from dotenv import load_dotenv
from datetime import timedelta


load_dotenv()

class Config:
    FLASK_APP = os.environ.get("FLASK_APP", "run")
    PORT = os.environ.get("PORT", 3000)
    SECRET_KEY = os.environ.get("SECRET_KEY", os.urandom(512))
    REMEMBER_COOKIE_DURATION = timedelta(days=10)
    JWT_SECRET_KEY = SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=14)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=17)

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DEV_DATABASE_URL', "sqlite:///database.sqlite"
    )


class TestingConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL")



class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('PROD_DATABASE_URL')


configs_dictionary = {
    "dev": DevelopmentConfig,
    "test": TestingConfig,
    "prod": ProductionConfig,
    "default": DevelopmentConfig,
}
