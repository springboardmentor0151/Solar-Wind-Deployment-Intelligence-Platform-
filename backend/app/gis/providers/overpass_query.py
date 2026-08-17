"""
Reusable Overpass API queries.

Placeholders:
{lat}
{lon}
{radius}
"""

SITE_FEATURES_QUERY = """
[out:json][timeout:30];

(
    way(around:{radius},{lat},{lon})["highway"];
    way(around:{radius},{lat},{lon})["landuse"];

    node(around:{radius},{lat},{lon})["power"="substation"];
    way(around:{radius},{lat},{lon})["power"="substation"];

    way(around:{radius},{lat},{lon})["power"="line"];

    way(around:{radius},{lat},{lon})["natural"="water"];
    way(around:{radius},{lat},{lon})["waterway"];

    way(around:{radius},{lat},{lon})["boundary"="protected_area"];
    relation(around:{radius},{lat},{lon})["boundary"="protected_area"];

    way(around:{radius},{lat},{lon})["leisure"="nature_reserve"];
);

out center tags;
"""