import json
import os
from django.contrib.auth import authenticate
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.contrib.auth.models import User, Permission, Group
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.middleware.csrf import get_token
from django.contrib import messages
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission, User
from django.contrib.contenttypes.models import ContentType

from django.core.management.base import BaseCommand
import api.models as md
from faker import Faker
import random

from django.core.management import call_command

from spellcorrector.settings import tmpPostgres
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    def handle(self, *args, **options):
        content_type= ContentType.objects.get_for_model(Permission)
        premium_spell_correction, _ = Permission.objects.get_or_create(
            codename="can_access_premium_spell_correction_models",
            name="Can access premium spell correction models",
            content_type=content_type,
        )
        standard_spell_correction, _ = Permission.objects.get_or_create(
            codename="can_access_standard_spell_correction_models",
            name="Can access standard spell correction models",
            content_type=content_type,
        )
        user_dashboard, _ = Permission.objects.get_or_create(
            codename="can_access_user_dashboard",
            name="Can access the user dashboard page",
            content_type=content_type,
        )
        auth_user_group, _ = Group.objects.get_or_create(name="Authenticated Users")
        guest_user_group, _ = Group.objects.get_or_create(name="Guest Users")

        auth_user_group.permissions.set([
            premium_spell_correction,
            standard_spell_correction,
            user_dashboard,
        ])

        guest_user_group.permissions.set([
            standard_spell_correction,
        ])

        guest_user = User.objects.get(username="GuestUser")
        auth_users = User.objects.all()

        for user in auth_users:
            if user == guest_user:
                guest_user.groups.add(guest_user_group)
            else:
                user.groups.add(auth_user_group)
            user.save()


