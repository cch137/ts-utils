const checkExpireFrequencyMs = 60000

function _formatTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `1 second`
  } else if (timeMs < 60000) {
    const seconds = Math.floor(timeMs / 1000)
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  } else if (timeMs < 3600000) {
    const minutes = Math.floor(timeMs / 60000)
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  } else {
    const hours = Math.floor(timeMs / 3600000)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
}

class RateLimiterUser extends Array {
  constructor() {
    super()
  }

  log(weight = 1) {
    this.push(...new Array(weight).fill(Date.now()))
  }

  expire(timestamp: number) {
    this.splice(0, this.before(timestamp))
  }

  before(timestamp: number) {
    let i = 0
    const { length } = this
    for (;i < length; i++) if (this[i] > timestamp) return i;
    return i
  }

  after(timestamp: number) {
    const { length } = this
    let i = length - 1
    for (;i > -1; i--) if (this[i] <= timestamp) return length - 1 - i;
    return length
  }
}

type RateLimiterRule = {
  timeMs: number
  maxCount: number
}

type RateLimiterResponse = {
  success: true
} | {
  success: false
  message: string
}

class RateLimiter extends Map<string, RateLimiterUser> {
  rules: RateLimiterRule[]
  #lastUpdated: number = 0

  constructor(rules: RateLimiterRule[] = []) {
    super()
    this.rules = rules
  }

  get maxRuleTimeMs() {
    return Math.max(0, ...this.rules.map((r) => r.timeMs))
  }

  user(name: string): RateLimiterUser {
    if (!this.has(name)) this.set(name, new RateLimiterUser())
    return this.get(name) as RateLimiterUser
  }

  log(name: string, weight = 1) {
    this.user(name).log(weight)
  }

  check(name: string): RateLimiterResponse {
    if (!this.has(name)) return { success: true }
    const user = this.user(name)
    const now = Date.now()
    if (this.#lastUpdated + checkExpireFrequencyMs < now) {
      this.#lastUpdated = now
      this.expire(this.maxRuleTimeMs)
    }
    for (const rule of this.rules) {
      if (user.after(now - rule.timeMs) > rule.maxCount) {
        return {
          success: false,
          message: `This service is rate limited, please try again after ${_formatTime(rule.timeMs)}.`
        }
      }
    }
    return { success: true }
  }

  expire(timestamp: number) {
    [...this].forEach(([name, user]) => {
      user.expire(timestamp)
      if (user.length === 0) this.delete(name)
    })
  }
}

export default RateLimiter
