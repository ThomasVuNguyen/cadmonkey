#!/usr/bin/env python3
"""
Test script for K-1B Chat Modal endpoints
Run with: python test_endpoints.py
"""

import requests
import json
import time
import sys

# Update these URLs with your actual deployment URLs
BASE_URL = "https://thomas-15--k-1b-chat"
CHAT_URL = f"{BASE_URL}-chat.modal.run"
HEALTH_URL = f"{BASE_URL}-health.modal.run"

def test_health():
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("Testing Health Endpoint")
    print("="*60)

    try:
        response = requests.get(HEALTH_URL, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("✓ Health check passed!")
            return True
        else:
            print("✗ Health check failed!")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_chat(message="hey cadmonkey, make me a box", max_tokens=100):
    """Test the standard chat endpoint"""
    print("\n" + "="*60)
    print("Testing Chat Endpoint")
    print("="*60)
    print(f"Message: {message}")

    payload = {
        "message": message,
        "max_tokens": max_tokens,
        "temperature": 0.7
    }

    try:
        print(f"\nSending request to: {CHAT_URL}")
        print(f"Payload: {json.dumps(payload, indent=2)}")

        start_time = time.time()
        response = requests.post(
            CHAT_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        elapsed_time = time.time() - start_time

        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Time: {elapsed_time:.2f}s")

        if response.status_code == 200:
            result = response.json()
            print(f"\nResponse: {json.dumps(result, indent=2)}")
            print("\n✓ Chat endpoint test passed!")
            return True
        else:
            print(f"\nError Response: {response.text}")
            print("✗ Chat endpoint test failed!")
            return False

    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False


def test_error_handling():
    """Test error handling with invalid requests"""
    print("\n" + "="*60)
    print("Testing Error Handling")
    print("="*60)

    # Test 1: Empty message
    print("\n1. Testing empty message...")
    try:
        response = requests.post(
            CHAT_URL,
            json={"message": "", "max_tokens": 50},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        result = response.json()
        if "error" in result:
            print(f"✓ Correctly returned error: {result['error']}")
        else:
            print("✗ Should have returned an error for empty message")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 2: Missing message field
    print("\n2. Testing missing message field...")
    try:
        response = requests.post(
            CHAT_URL,
            json={"max_tokens": 50},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        result = response.json()
        if "error" in result:
            print(f"✓ Correctly returned error: {result['error']}")
        else:
            print("✗ Should have returned an error for missing message")
    except Exception as e:
        print(f"✗ Error: {e}")

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("K-1B Chat Modal Endpoint Tests")
    print("="*60)
    print(f"\nBase URL: {BASE_URL}")
    print(f"Chat URL: {CHAT_URL}")
    print(f"Health URL: {HEALTH_URL}")

    results = []

    # Test 1: Health Check
    results.append(("Health Check", test_health()))

    # Test 2: Chat - Box
    results.append(("Chat (Box)", test_chat("hey cadmonkey, make me a box", max_tokens=100)))

    # Test 3: Chat - Sphere
    results.append(("Chat (Sphere)", test_chat("hey cadmonkey, make me a sphere", max_tokens=100)))

    # Test 4: Chat - Cylinder
    results.append(("Chat (Cylinder)", test_chat("hey cadmonkey, make me a cylinder", max_tokens=100)))

    # Test 5: Chat - Cone
    results.append(("Chat (Cone)", test_chat("hey cadmonkey, make me a cone", max_tokens=100)))

    # Test 6: Chat - Torus
    results.append(("Chat (Torus)", test_chat("hey cadmonkey, make me a torus", max_tokens=100)))

    # Test 7: Complex shape
    results.append(("Chat (Complex)", test_chat("hey cadmonkey, make me a cube with rounded edges", max_tokens=200)))

    # Test 8: Error Handling
    test_error_handling()

    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name}: {status}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

def interactive_chat():
    """Interactive chat mode"""
    print("\n" + "="*60)
    print("Interactive Chat Mode")
    print("="*60)
    print("Type your messages below (or 'quit' to exit)")
    print("-" * 60)

    while True:
        try:
            message = input("\nYou: ").strip()

            if message.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break

            if not message:
                continue

            print("\nAssistant: ", end='', flush=True)

            response = requests.post(
                CHAT_URL,
                json={
                    "message": message,
                    "max_tokens": 200,
                    "temperature": 0.7
                },
                headers={"Content-Type": "application/json"},
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                print(result.get('response', 'No response'))
            else:
                print(f"Error: {response.status_code} - {response.text}")

        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"\nError: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_chat()
    else:
        exit_code = run_all_tests()
        sys.exit(exit_code)
