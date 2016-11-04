"""Database modles for storuing lightstream metadata
"""
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from lux.extensions import odm
from lux.utils.text import engine

from odm.types import JSONType, UUIDType


Model = odm.model_base('applications')


class AppDomain(Model):
    id = Column(UUIDType(binary=False), primary_key=True)
    """Unique ID of application"""
    name = Column(String(120), nullable=False, unique=True)
    """Unique name of application"""
    token = Column(String(32), nullable=False, unique=True)
    """Unique token for root control of application"""
    domain = Column(String(120), nullable=True, unique=True)
    """Unique domain name of this application"""
    config = Column(JSONType)

    def __str__(self):
        return self.name


class AppModelMixin:

    @classmethod
    def plural(cls):
        return engine.plural(cls.__name__.lower())

    # application that owns this worker
    @odm.declared_attr
    def application_id(cls):
        return Column(ForeignKey('appdomain.id', ondelete='CASCADE'),
                      nullable=False)

    @odm.declared_attr
    def application(cls):
        return relationship("AppDomain", backref=cls.plural())