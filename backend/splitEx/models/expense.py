from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from . import db
from .user_expenses import user_expenses

class SplitMethod(enum.Enum):
    EQUAL = "equal"
    UNEQUAL = "unequal"

class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    split_method = db.Column(db.Enum(SplitMethod), default=SplitMethod.EQUAL, nullable=False)
    total_amount = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # foreign Keys
    payer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)

    # relationships
    users = db.relationship('User', secondary=user_expenses, back_populates='expenses')
    participants = db.relationship('ExpenseParticipant', backref='expense', cascade="all, delete-orphan")

    def __init__(self, title, total_amount, split_method=SplitMethod.EQUAL, date=None, payer_id=None):
        self.title = title
        self.total_amount = total_amount
        self.split_method = split_method
        self.date = date or datetime.utcnow().date()
        self.payer_id = payer_id

    def __repr__(self):
        return f'<Expense {self.title}>'

class ExpenseParticipant(db.Model):
    __tablename__ = 'expense_participants'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = db.Column(db.Integer, nullable=False)
    item = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # foreign Keys
    expense_id = db.Column(UUID(as_uuid=True), db.ForeignKey('expenses.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)

    def __init__(self, expense_id, user_id, amount, item=None):
        self.expense_id = expense_id
        self.user_id = user_id
        self.amount = amount
        self.item = item

    def __repr__(self):
        return f'<ExpenseParticipant {self.user_id} in {self.expense_id}>'
