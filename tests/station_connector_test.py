import importlib.util
import sqlite3
import unittest
from pathlib import Path
from unittest.mock import patch

path = Path(__file__).parents[1] / 'integrations/station-os/admin_connector.py'
spec = importlib.util.spec_from_file_location('station_connector', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ConnectorTests(unittest.TestCase):
    def test_product_write_is_verified_by_readback(self):
        calls=[]
        def fake(path, method='GET', body=None, write_token=None):
            calls.append((path, method, body, write_token))
            if path == '/ops/products/list': return {'products':[{'productId':'coffee-01'}]}
            return {'ok': True}
        command={'type':'station.product.upsert','entityId':'coffee-01','changes':{'productId':'coffee-01','name':'Coffee','category':'drink'}}
        with patch.object(module, 'local_json', side_effect=fake):
            ok, error=module.apply_command(sqlite3.connect(':memory:'), command, 'secret-not-logged')
        self.assertTrue(ok); self.assertIsNone(error)
        self.assertEqual(calls[0][1], 'POST'); self.assertEqual(calls[1][1], 'GET')

    def test_missing_readback_fails_ack(self):
        def fake(path, method='GET', body=None, write_token=None):
            return {'products':[]} if method == 'GET' else {'ok': True}
        command={'type':'station.product.upsert','entityId':'missing','changes':{'productId':'missing','name':'X','category':'drink'}}
        with patch.object(module, 'local_json', side_effect=fake):
            ok, error=module.apply_command(sqlite3.connect(':memory:'), command, 'secret-not-logged')
        self.assertFalse(ok); self.assertEqual(error, 'verification_failed')

    def test_station_api_write_requires_configured_token(self):
        command={'type':'station.product.upsert','entityId':'coffee-01','changes':{'productId':'coffee-01','name':'Coffee','category':'drink'}}
        with patch.object(module, 'local_json') as local_json:
            ok, error=module.apply_command(sqlite3.connect(':memory:'), command, '')
        self.assertFalse(ok); self.assertEqual(error, 'station_write_unavailable')
        local_json.assert_not_called()

    def test_bom_write_uses_real_list_response_key(self):
        def fake(path, method='GET', body=None, write_token=None):
            if path == '/ops/bom/list': return {'bom':[{'productId':'coffee-01'}]}
            return {'ok': True}
        command={'type':'station.bom.upsert','entityId':'coffee-01','changes':{'productId':'coffee-01','materials':[]}}
        with patch.object(module, 'local_json', side_effect=fake):
            ok, error=module.apply_command(sqlite3.connect(':memory:'), command, 'configured-token')
        self.assertTrue(ok); self.assertIsNone(error)

if __name__ == '__main__': unittest.main()
