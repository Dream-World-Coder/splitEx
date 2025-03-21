from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, ForeignKey, Table
from . import db

user_expenses = Table(
    'user_expenses',
    db.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('expense_id', UUID(as_uuid=True), ForeignKey('expenses.id'), primary_key=True)
)
