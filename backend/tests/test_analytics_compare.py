import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_analytics_compare(
    async_client: AsyncClient,
    auth_headers: dict,
    paired_device: dict,
):
    response = await async_client.get(
        "/api/v1/analytics/compare",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "devices" in data
    assert paired_device["device_id"] in data["devices"]
    assert "series" in data
    assert isinstance(data["series"], list)
