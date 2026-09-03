from sqlalchemy.exc import NotSupportedError

from app.db import init_db as init_db_module


class _DummyConnection:
    def execute(self, _statement):
        statement_text = str(_statement)
        if "postgis" in statement_text:
            raise NotSupportedError(statement_text, None, Exception('extension "postgis" is not available'))
        return None


class _DummyTransaction:
    def __enter__(self):
        return _DummyConnection()

    def __exit__(self, exc_type, exc, tb):
        return False


def test_reset_schema_ignores_missing_postgis(monkeypatch) -> None:
    monkeypatch.setattr(init_db_module.engine, "begin", lambda: _DummyTransaction())

    init_db_module._reset_schema()
