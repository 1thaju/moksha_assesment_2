import unittest

from app.agent.agent import extract_order_id, extract_product_name
from app.services.stripe_service import build_local_checkout_url


class AgentSupportParsingTests(unittest.TestCase):
    def test_extract_product_name_from_price_question(self):
        self.assertEqual(
            extract_product_name("What is the price of Hydrating Shampoo?"),
            "Hydrating Shampoo",
        )

    def test_extract_product_name_from_product_lookup(self):
        self.assertEqual(
            extract_product_name("Do you have Curling Gel available?"),
            "Curling Gel",
        )

    def test_extract_order_id_from_question(self):
        self.assertEqual(
            extract_order_id("What is the status of order #ORD-123?"),
            "ORD-123",
        )

    def test_extract_order_id_from_named_status_question(self):
        self.assertIsNone(
            extract_order_id("What is the status of my order?"),
        )

    def test_build_local_checkout_url(self):
        self.assertIn("/checkout/success?order_id=order_123", build_local_checkout_url("order_123"))


if __name__ == "__main__":
    unittest.main()
