"""add_is_admin

Adds the `is_admin` boolean to the users table. Admins may log into the
operator dashboard and call the cross-tenant /api/v1/admin/* endpoints.

Revision ID: c1a2b3c4d5e6
Revises: 59cd91348616
Create Date: 2026-06-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a2b3c4d5e6'
down_revision: Union[str, None] = '59cd91348616'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default backfills existing rows so the NOT NULL constraint holds.
    op.add_column(
        'users',
        sa.Column(
            'is_admin',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    # Drop the server default now that existing rows are backfilled; new rows
    # get their default from the ORM model instead.
    op.alter_column('users', 'is_admin', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'is_admin')
