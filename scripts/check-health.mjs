const baseUrl = process.env.ONE82_HEALTH_URL || 'http://localhost:3000';
const url = `${baseUrl.replace(/\/$/, '')}/api/health`;

const run = async () => {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    const body = await response.json();

    if (!response.ok) {
      console.error(`❌ Health check failed with status ${response.status}`);
      console.error(JSON.stringify(body, null, 2));
      process.exit(1);
    }

    if (!body?.ok) {
      console.error('❌ Health payload reports failure.');
      console.error(JSON.stringify(body, null, 2));
      process.exit(1);
    }

    console.log('✅ Health check passed.');
    console.log(JSON.stringify(body, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Health check request failed: ${message}`);
    process.exit(1);
  }
};

run();
