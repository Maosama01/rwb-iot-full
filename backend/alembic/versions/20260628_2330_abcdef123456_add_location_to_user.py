"""Add location to user

Revision ID: abcdef123456
Revises: 59cd91348616
Create Date: 2026-06-28 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'abcdef123456'
down_revision = '59cd91348616'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('location', sa.String(length=255), nullable=True))

def downgrade() -> None:
    op.drop_column('users', 'location')
