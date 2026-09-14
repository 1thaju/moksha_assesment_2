import unittest

from app.schemas.product import ProductUpdate


class ProductUpdateSchemaTests(unittest.TestCase):
    def test_update_allows_currency_field(self):
        payload = ProductUpdate.model_validate({
            "name": "New shampoo",
            "description": "Updated formula",
            "price_cents": 1500,
            "currency": "eur",
            "image_url": "https://example.com/shampoo.jpg",
            "stock": 8,
        })

        self.assertEqual(payload.name, "New shampoo")
        self.assertEqual(payload.currency, "eur")
        self.assertEqual(payload.stock, 8)


if __name__ == "__main__":
    unittest.main()
