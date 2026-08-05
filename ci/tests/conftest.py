import warnings
import urllib3
import pytest


@pytest.fixture(autouse=True)
def suppress_self_signed_tls_warning():
    """CI uses a self-signed cert by design (ephemeral environment). We call
    requests with verify=False intentionally, so urllib3's InsecureRequestWarning
    is expected noise here, not a finding. A real deployment uses a CA cert."""
    warnings.simplefilter("ignore", urllib3.exceptions.InsecureRequestWarning)
    yield
