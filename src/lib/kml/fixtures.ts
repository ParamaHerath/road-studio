/**
 * Test fixtures representing real and edge-case road geometries in Sri Lanka.
 * Coordinates are formatted as [longitude, latitude, optional altitude].
 */

export const FIXTURE_CONSECUTIVE_SEGMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Consecutive Road Segments</name>
    <Placemark>
      <name>A1 Segment 1 - Colombo to Kelaniya</name>
      <LineString>
        <coordinates>
          79.8612,6.9271,0
          79.8850,6.9450,0
          79.9200,6.9600,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>A1 Segment 2 - Kelaniya to Kadawatha</name>
      <LineString>
        <coordinates>
          79.9200,6.9600,0
          79.9400,6.9800,0
          79.9540,7.0010,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_DISCONNECTED_SAME_NAME = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Disconnected Same Name Roads</name>
    <Placemark>
      <name>A1 Road</name>
      <description>Section in Western Province</description>
      <LineString>
        <coordinates>
          79.8612,6.9271,0
          79.8900,6.9450,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>A1 Road</name>
      <description>Section in Central Province</description>
      <LineString>
        <coordinates>
          80.6000,7.2800,0
          80.6350,7.2950,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_BYPASS_BRANCH = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Main Road with Bypass Branch</name>
    <Placemark>
      <name>A1 Main Highway</name>
      <LineString>
        <coordinates>
          79.9200,6.9600,0
          79.9500,7.0000,0
          79.9800,7.0500,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Kadawatha Bypass</name>
      <LineString>
        <coordinates>
          79.9500,7.0000,0
          79.9650,7.0250,0
          79.9800,7.0500,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_ROUNDABOUT = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Roundabout with Feeder Roads</name>
    <Placemark>
      <name>Kurunegala Roundabout Ring</name>
      <LineString>
        <coordinates>
          80.3640,7.4860,0
          80.3650,7.4870,0
          80.3660,7.4860,0
          80.3650,7.4850,0
          80.3640,7.4860,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>North Approach Road</name>
      <LineString>
        <coordinates>
          80.3650,7.4950,0
          80.3650,7.4870,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>South Approach Road</name>
      <LineString>
        <coordinates>
          80.3650,7.4850,0
          80.3650,7.4770,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_REVERSED_COORDINATES = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Reversed Coordinate Order</name>
    <Placemark>
      <name>Road Heading East to J</name>
      <LineString>
        <coordinates>
          79.8500,6.9200,0
          79.8700,6.9250,0
          79.9000,6.9300,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Road Heading West to J</name>
      <LineString>
        <coordinates>
          79.9500,6.9400,0
          79.9250,6.9350,0
          79.9000,6.9300,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_DUPLICATE_ENDPOINTS = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Road with Duplicate Consecutive Endpoints</name>
    <Placemark>
      <name>A3 Negombo Road</name>
      <LineString>
        <coordinates>
          79.8700,7.0000,0
          79.8800,7.0500,0
          79.8900,7.1000,0
          79.8900,7.1000,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_NEARLY_COINCIDENT_ENDPOINTS = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Nearly Coincident Endpoints (~3m gap)</name>
    <Placemark>
      <name>Road Section 1</name>
      <LineString>
        <coordinates>
          80.0000,7.0000,0
          80.0500,7.0500,0
          80.100000,7.100000,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Road Section 2</name>
      <LineString>
        <coordinates>
          80.100025,7.100018,0
          80.150000,7.150000,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_MULTIPART_LINE = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Multipart Road Line</name>
    <Placemark>
      <name>A2 Galle Road Multipart</name>
      <MultiGeometry>
        <LineString>
          <coordinates>
            79.8550,6.9100,0
            79.8600,6.8800,0
            79.8700,6.8500,0
          </coordinates>
        </LineString>
        <LineString>
          <coordinates>
            79.8800,6.8000,0
            79.8900,6.7500,0
            79.9100,6.7000,0
          </coordinates>
        </LineString>
      </MultiGeometry>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_MISSING_METADATA = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <LineString>
        <coordinates>
          80.7500,7.9500,0
          80.8000,8.0000,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_WITH_UNSUPPORTED_CONSTRUCTS = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Mixed Content</name>
    <NetworkLink>
      <name>Live Traffic Link</name>
      <Link><href>http://example.com/traffic.kml</href></Link>
    </NetworkLink>
    <GroundOverlay>
      <name>Historic Overlay</name>
    </GroundOverlay>
    <Placemark>
      <name>Colombo City Center</name>
      <Point>
        <coordinates>79.8612,6.9271,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Valid Road Line</name>
      <LineString>
        <coordinates>
          79.8612,6.9271,0
          79.8700,6.9350,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export const FIXTURE_MALFORMED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Broken KML
    <Placemark>
      <LineString>
</kml>`;

export const FIXTURE_NON_KML_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Not a KML File</title>
  </channel>
</rss>`;

export const FIXTURE_EMPTY = `   `;
