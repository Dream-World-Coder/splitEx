'''also add some helper functions, to quickly implement in routes, such as adding a participant, calculating total amount an user has to '''

from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from typing import Optional
from werkzeug.security import check_password_hash

from . import db
from .user_expenses import user_expenses

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ipAddress = db.Column(db.String(45), nullable=True, default='unknownIp')

    # relationships
    expenses = db.relationship('Expense', secondary=user_expenses, back_populates='users')
    paid_expenses = db.relationship('Expense', backref='paid_by', foreign_keys='Expense.payer_id')
    participations = db.relationship('ExpenseParticipant', backref='user')

    def __init__(self, email: str, username: str, name: str, password_hash: str, ipAddress: Optional[str] = None):
        self.email = email
        self.username = username
        self.name = name
        self.password_hash = password_hash
        self.ipAddress = ipAddress

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'
