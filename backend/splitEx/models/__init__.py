from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_app(app: Flask):
    db.init_app(app)

    from .user import User
    from .expense import Expense, ExpenseParticipant, SplitMethod

    with app.app_context():
        db.create_all()
