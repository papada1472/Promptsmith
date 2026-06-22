import assert from 'assert';

async function testGatewayTimeout() {
    console.log("Testing Gateway Timeout...");
    // Use a non-routable IP to force a timeout or connection failure
    process.env.REFINZI_GATEWAY_URL = "http://10.255.255.1";
    
    const { GatewayProvider } = await import('../src/main/ai/GatewayProvider.js');
    const provider = new GatewayProvider({
        apiKey: "test-key",
        systemPrompt: "test prompt",
        timeoutMs: 1000 // 1 second timeout
    });

    const start = Date.now();
    try {
        await provider.refine("test text");
        console.log("FAIL: Request should have timed out");
    } catch (e) {
        const duration = Date.now() - start;
        console.log(`Caught error: ${e.message} (code: ${e.code}) in ${duration}ms`);
        if (e.code === 'gateway_timeout') {
            console.log("PASS: Correct error code 'gateway_timeout' received");
        } else {
            console.log("FAIL: Expected 'gateway_timeout'");
        }
        // Give some leeway for overhead
        if (duration >= 1000 && duration < 5000) {
             console.log("PASS: Timeout enforced correctly around 1000ms");
        } else {
             console.log(`FAIL: Timeout not enforced correctly (duration: ${duration}ms)`);
        }
    }
}

async function testProviderSelection() {
    console.log("\nTesting Provider Selection...");
    
    const { ProviderManager } = await import('../src/main/ai/ProviderManager.js');
    const idWithKey = ProviderManager.getActiveProviderId({ geminiApiKey: "some-key" });
    console.log(`Provider with key: ${idWithKey}`);
    assert.strictEqual(idWithKey, "gemini", "Should select gemini if key present");
    
    const idNoKey = ProviderManager.getActiveProviderId({ geminiApiKey: null });
    console.log(`Provider no key: ${idNoKey}`);
    assert.strictEqual(idNoKey, "gateway", "Should select gateway if key missing");
    
    console.log("PASS: Provider selection logic correct");
}

async function run() {
    try {
        await testGatewayTimeout();
        await testProviderSelection();
    } catch (e) {
        console.error("Test failed:", e);
    }
}

run();
