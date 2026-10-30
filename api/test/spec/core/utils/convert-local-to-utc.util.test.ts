import { convertLocalToUTC } from '@core/utils/convert-local-to-utc.util'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * `convertLocalToUTC` receives wall-clock timestamps: the mssql driver hands
 * over a `Date`, other callers hand over the raw string. Both shapes must be
 * read as a wall clock in `timeZone`, never as a host-local instant, otherwise
 * the same input produces different UTC values on different machines.
 */
const ORIGINAL_HOST_TIME_ZONE = process.env.TZ

// Both zones differ from the target zone. Lima also matches it, which is the
// case that double-shifts once the host timezone leaks into the parsing.
const HOST_TIME_ZONES = ['Asia/Tokyo', 'America/Lima']

describe('convertLocalToUTC', () => {
  // America/Lima is UTC-5 all year round: 08:00 local is 13:00 UTC.
  const limaWallClock = '2025-09-07T08:00:00'
  const expectedUtc = new Date('2025-09-07T13:00:00.000Z')

  afterEach(() => {
    if (ORIGINAL_HOST_TIME_ZONE === undefined) delete process.env.TZ
    else process.env.TZ = ORIGINAL_HOST_TIME_ZONE
  })

  it.each(HOST_TIME_ZONES)('no depende de la zona horaria del host (%s)', hostTimeZone => {
    process.env.TZ = hostTimeZone

    const fromDate = convertLocalToUTC(new Date('2025-09-07T08:00:00Z'), 'America/Lima')
    const fromString = convertLocalToUTC(limaWallClock, 'America/Lima')

    expect(fromDate).toEqual(expectedUtc)
    expect(fromString).toEqual(expectedUtc)
  })
})
