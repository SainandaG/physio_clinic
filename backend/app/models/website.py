from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class SiteContent(Base):
    """Admin edits to one section of website wording (see app/content.py for the defaults)."""
    __tablename__ = "site_content"

    key = Column(String(50), primary_key=True)        # clinic | seo | home | about | treatments | contact | blog
    value = Column(JSON, nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(220), unique=True, index=True, nullable=False)
    excerpt = Column(Text, nullable=True)              # card summary; also the default meta description
    content = Column(Text, nullable=False, default="")  # Markdown
    cover_image_url = Column(String(500), nullable=True)
    author_name = Column(String(150), nullable=True)
    tags = Column(JSON, nullable=True)                 # list of strings
    status = Column(String(20), default="draft", index=True)  # draft | published
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(300), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
