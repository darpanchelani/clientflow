from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.users.models import User


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.password = "StrongPass123!"
        self.user = User.objects.create_user(
            email="existing@example.com",
            password=self.password,
            first_name="Existing",
            last_name="User",
            organization_name="ClientFlow",
        )

    @staticmethod
    def image_upload(name="profile.png", color=(53, 86, 216)):
        content = BytesIO()
        Image.new("RGB", (32, 32), color=color).save(content, format="PNG")
        return SimpleUploadedFile(name, content.getvalue(), content_type="image/png")

    def test_register_returns_tokens_and_user(self):
        payload = {
            "email": "new@example.com",
            "password": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
            "organization_name": "ClientFlow",
        }

        response = self.client.post(reverse("auth:register"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], payload["email"])
        self.assertEqual(response.data["user"]["role"], "user")

    def test_register_rejects_existing_email_with_field_error(self):
        payload = {
            "email": self.user.email,
            "password": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
            "organization_name": "ClientFlow",
        }

        response = self.client.post(reverse("auth:register"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertIn("email", response.data["fields"])
        self.assertEqual(
            response.data["fields"]["email"][0],
            "A user with this email already exists.",
        )

    def test_register_rejects_weak_password_with_field_error(self):
        payload = {
            "email": "weak@example.com",
            "password": "password",
            "first_name": "Weak",
            "last_name": "Password",
            "organization_name": "ClientFlow",
        }

        response = self.client.post(reverse("auth:register"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertIn("password", response.data["fields"])
        self.assertTrue(len(response.data["fields"]["password"]) > 0)

    def test_login_returns_tokens_and_user(self):
        payload = {
            "email": self.user.email,
            "password": self.password,
        }

        response = self.client.post(reverse("auth:login"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)

    def test_profile_returns_authenticated_user(self):
        login_response = self.client.post(
            reverse("auth:login"),
            {"email": self.user.email, "password": self.password},
            format="json",
        )
        access = login_response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(reverse("auth:profile"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user.email)
        self.assertEqual(response.data["role"], self.user.role)

    def test_profile_updates_personal_details_without_changing_account_scope(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            reverse("auth:profile"),
            {
                "first_name": "  Updated  ",
                "last_name": "Name",
                "email": "changed@example.com",
                "organization_name": "Another workspace",
                "role": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")
        self.assertEqual(self.user.last_name, "Name")
        self.assertEqual(self.user.email, "existing@example.com")
        self.assertEqual(self.user.organization_name, "ClientFlow")
        self.assertEqual(self.user.role, User.Role.USER)

    def test_profile_photo_can_be_added_replaced_and_removed(self):
        self.client.force_authenticate(self.user)

        with TemporaryDirectory() as media_root, override_settings(
            MEDIA_ROOT=media_root
        ):
            upload_response = self.client.patch(
                reverse("auth:profile"),
                {"profile_photo": self.image_upload()},
                format="multipart",
            )

            self.assertEqual(upload_response.status_code, status.HTTP_200_OK)
            self.assertTrue(
                upload_response.data["profile_photo_url"].startswith("http")
            )
            self.user.refresh_from_db()
            first_photo = Path(media_root, self.user.profile_photo.name)
            self.assertTrue(first_photo.exists())

            replace_response = self.client.patch(
                reverse("auth:profile"),
                {"profile_photo": self.image_upload("replacement.png", (22, 119, 102))},
                format="multipart",
            )

            self.assertEqual(replace_response.status_code, status.HTTP_200_OK)
            self.user.refresh_from_db()
            current_photo = Path(media_root, self.user.profile_photo.name)
            self.assertTrue(current_photo.exists())
            self.assertFalse(first_photo.exists())

            remove_response = self.client.delete(reverse("auth:profile-photo"))

            self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
            self.assertIsNone(remove_response.data["profile_photo_url"])
            self.user.refresh_from_db()
            self.assertFalse(self.user.profile_photo)
            self.assertFalse(current_photo.exists())

    def test_profile_photo_rejects_non_image_upload(self):
        self.client.force_authenticate(self.user)
        upload = SimpleUploadedFile(
            "profile.txt",
            b"not an image",
            content_type="text/plain",
        )

        response = self.client.patch(
            reverse("auth:profile"),
            {"profile_photo": upload},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_photo", response.data["fields"])

    def test_password_change_rejects_incorrect_current_password(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(
            reverse("auth:password-change"),
            {
                "current_password": "incorrect-password",
                "new_password": "DifferentStrongPass456!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data["fields"])
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.password))

    def test_password_change_updates_password_and_revokes_refresh_token(self):
        login_response = self.client.post(
            reverse("auth:login"),
            {"email": self.user.email, "password": self.password},
            format="json",
        )
        access = login_response.data["access"]
        refresh = login_response.data["refresh"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.post(
            reverse("auth:password-change"),
            {
                "current_password": self.password,
                "new_password": "DifferentStrongPass456!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("DifferentStrongPass456!"))

        self.client.credentials()
        refresh_response = self.client.post(
            reverse("auth:refresh"),
            {"refresh": refresh},
            format="json",
        )
        self.assertIn(
            refresh_response.status_code,
            {status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED},
        )

    def test_refresh_rotates_token_pair(self):
        login_response = self.client.post(
            reverse("auth:login"),
            {"email": self.user.email, "password": self.password},
            format="json",
        )
        refresh = login_response.data["refresh"]

        response = self.client.post(
            reverse("auth:refresh"),
            {"refresh": refresh},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertNotEqual(response.data["refresh"], refresh)

    def test_logout_blacklists_refresh_token(self):
        login_response = self.client.post(
            reverse("auth:login"),
            {"email": self.user.email, "password": self.password},
            format="json",
        )
        refresh = login_response.data["refresh"]

        logout_response = self.client.post(
            reverse("auth:logout"),
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        refresh_response = self.client.post(
            reverse("auth:refresh"),
            {"refresh": refresh},
            format="json",
        )
        self.assertIn(
            refresh_response.status_code,
            {status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED},
        )
