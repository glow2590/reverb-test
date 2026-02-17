'use server'

import { getClientDataFromCookies } from './helpers'

/**
 * Generates an R-Auth token using local logic that mimics the Redstrim API's encoding algorithm.
 *
 * This function constructs a token based on device information and a timestamp, applying
 * a series of bitwise operations and XOR encryption to produce a Base64-encoded string.
 * The logic is ported from the original PHP implementation used by the Redstrim API.
 *
 * The function allows optional parameters for device identifier, serial number, timestamp,
 * device model, operating system, and device type. If not provided, reasonable defaults
 * and random values are used.
 *
 * @param {string} [deviceIdentifier] - Unique identifier for the device (default: 'web-fingerprint-fb9cd3a645fe5aec').
 * @param {string} [sn] - Serial number for the device (default: random string).
 * @param {string} [timestamp] - Unix timestamp as a string (default: current time).
 * @param {string} [deviceModel] - Device model string (default: random string).
 * @param {string} [os] - Operating system string (default: random string).
 * @param {typeof DeviceType} [deviceType] - Device type (default: DeviceType.UNKNOWN).
 * @returns {Promise<string>} A promise that resolves to the generated R-Auth token.
 *
 * @example
 * ```typescript
 * import { getRAuthToken } from './utils/api/getRAuthToken';
 *
 * async function authenticate() {
 *   const token = await getRAuthToken();
 *   // Use the token for authenticated API requests
 * }
 * ```
 *
 * This function is typically used to generate an authentication token locally
 * before making requests to APIs that require the R-Auth token for authorization.
 */

//  for now will just hit the API to get the token
// https://api.redstrim.com/api/rauth/test/encode


export async function getRAuthToken(
  deviceIdentifier?: string,
  sn?: string,
  timestamp?: string,
  deviceModel?: string,
  os?: string,
): Promise<string> {
  // Use the utility function to get clientData
  const clientData = await getClientDataFromCookies()

  const {
    fingerprint,
    deviceModel: clientDeviceModel,
    os: clientOs,
  } = clientData ?? {}

  const finalDeviceIdentifier = `web-fingerprint-${fingerprint ? fingerprint : deviceIdentifier || 'fb9cd3a645fe5jim'}`

  const finalSn = sn || `sn-85845426`

  // ${generateRandomString(12)}

  // Convert timestamp to integer, default to current Unix timestamp if not provided
  const finalTimestamp = timestamp ? parseInt(timestamp, 10) : Math.floor(Date.now() / 1000)
  const finalDeviceModel = clientDeviceModel || deviceModel || `device_model-65656565`
  const finalOs = clientOs || os || `windows`

  // --- PHP's "random bytes for the first 4 bytes of the token" logic translation ---
  // PHP's integer operations often implicitly work with 32-bit representations for bitwise ops.
  // JavaScript's bitwise operators (`<<`, `^`, `*`, `+`, `>>`) also operate on 32-bit signed integers.
  // We replicate the exact sequence of operations.
  let random = finalTimestamp

  random = (random << 21) ^ (random << 19) ^ random
  random = random * 251 + 19

  // Extract individual bytes from the 'random' integer.
  // The `& 0xFF` ensures we get only the last 8 bits (a byte value).
  let b0 = (random >> 24) & 0xff
  let b1 = (random >> 16) & 0xff
  let b2 = (random >> 8) & 0xff
  let b3 = random & 0xff

  // Apply XOR transformations to these four bytes as per PHP logic
  const tmp = b0

  b0 = b0 ^ b1
  b1 = b1 ^ b2
  b2 = b2 ^ b3
  b3 = b3 ^ tmp

  // --- Construct the initial data block ---
  // Create a Uint8Array for the first four modified bytes
  const initialBytes = new Uint8Array([b0, b1, b2, b3])

  // Construct the rest of the data string using TextEncoder to get its byte representation.
  const dataString = `${finalDeviceIdentifier}|${finalSn}|${finalTimestamp}|${finalDeviceModel}|${finalOs}|Web|3|${process.env.NODE_ENV === 'development' ? 'true' : 'false'}`
  const dataBytes = new TextEncoder().encode(dataString) // Converts string to UTF-8 bytes

  // Combine the initial 4 bytes with the data string bytes into a single Uint8Array.
  const combinedData = new Uint8Array(initialBytes.length + dataBytes.length)

  combinedData.set(initialBytes, 0) // Place the first 4 bytes at the beginning
  combinedData.set(dataBytes, initialBytes.length) // Append the rest of the data bytes

  // --- XOR Encryption Key ---
  // The fixed key from the PHP code, represented as a Uint8Array of byte values.
  const key = new Uint8Array([
    0x09, 0x9d, 0xc8, 0x96, 0x3f, 0x9b, 0x5e, 0x0c, 0xce, 0xc8, 0xa5, 0xef, 0xa4, 0x21, 0xbe, 0x7c, 0xb0, 0xc2, 0xb0,
    0xc9, 0xd5, 0x5c, 0xcc, 0x33, 0x79, 0x52, 0xe7, 0x83, 0x3c, 0xd2, 0x79, 0xd3, 0x49, 0xc0, 0xf9, 0x70, 0xe9, 0xa6,
    0x34, 0x42, 0x2b, 0x13, 0xfb, 0xd0, 0x26, 0x34, 0xf2, 0xd8, 0x86, 0xb5, 0x72, 0xd5, 0x13, 0x74, 0x5d, 0xc5, 0xb2,
    0xaa, 0x4d, 0x68, 0x3f, 0x1a, 0xaa, 0x6e
  ])

  const keylen = key.length
  const datalen = combinedData.length

  // --- Apply XOR encryption loop ---
  // This loop iterates through the combinedData array starting from the 5th byte (index 4).
  // Each byte is XORed with a byte from the key (cycling using modulo)
  // and then XORed again with one of the initial four bytes (also cycling using modulo).
  // The first four bytes (indices 0-3) are NOT modified by this loop.
  for (let i = 4; i < datalen; i++) {
    combinedData[i] = combinedData[i] ^ key[i % keylen] ^ combinedData[i % 4]
  }

  // --- Base64 Encoding ---
  // `btoa()` expects a "binary string" where each character's code point is a byte value.
  // `String.fromCharCode(...combinedData)` converts the Uint8Array of bytes back into such a string.
  const binaryString = String.fromCharCode(...combinedData)
  const encodedToken = btoa(binaryString) // Perform Base64 encoding

  return encodedToken as string

  // return data?.token as string
}
