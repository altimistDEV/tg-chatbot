# Centralized Log Management with Better Stack

## Overview

The enhanced logging system now supports streaming logs to Better Stack (formerly Logtail) for centralized log management, monitoring, and analytics. Better Stack offers a generous free tier with 1GB/month of logs and unlimited retention.

## Features

### Multi-Transport Logging
- **Local Console**: Pretty-printed logs in development, structured JSON in production
- **Better Stack**: Real-time log streaming to cloud dashboard
- **Automatic Fallback**: Works with or without Better Stack configuration

### Enhanced Capabilities
- Correlation IDs for request tracking
- User context preservation (username, platform, tier)
- Performance metrics tracking
- Audit logging for compliance
- Custom event and metric tracking

## Setup Instructions

### 1. Create Better Stack Account

1. Visit [https://betterstack.com](https://betterstack.com)
2. Sign up for a free account
3. Create a new team or use the default one

### 2. Create a Log Source

1. Navigate to **Logs** → **Sources**
2. Click **"Add source"**
3. Select **"Node.js"** as the platform
4. Name your source (e.g., "tg-chatbot-production")
5. Copy the **Source Token**

### 3. Configure Environment

Add the token to your `.env` file:

```env
# Better Stack Configuration
BETTERSTACK_SOURCE_TOKEN=your_source_token_here
# or
LOGTAIL_SOURCE_TOKEN=your_source_token_here
```

### 4. Test the Integration

Run the test script to verify everything works:

```bash
npx tsx test-better-stack.ts
```

You should see logs both in your console and Better Stack dashboard.

## Better Stack Dashboard Features

### Live Tail
Real-time log streaming as they arrive:
- Navigate to **Logs** → **Live tail**
- Filter by source, level, or search terms
- Pause/resume streaming

### Search & Filters
Powerful search capabilities:
- **By Correlation ID**: `correlationId:"req_abc123"`
- **By User**: `username:"@johndoe"`
- **By Action**: `action:"COMMAND_EXECUTED"`
- **By Level**: `level:error`
- **By Module**: `module:"trading"`

### Saved Views
Create custom views for different use cases:
- Error Dashboard: `level:error OR level:fatal`
- Trading Activity: `action:POSITION_CHECKED OR action:TRADE_ANALYSIS_REQUESTED`
- User Sessions: `action:USER_SESSION_START OR action:USER_SESSION_END`
- API Performance: `action:API_CALL AND performance.responseTime:>1000`

### Charts & Analytics

Create visual dashboards:

1. **Command Usage Chart**:
   - Type: Line chart
   - Query: `action:COMMAND_EXECUTED`
   - Group by: `command`
   - Aggregate: Count

2. **Response Time Metrics**:
   - Type: Histogram
   - Query: `performance.responseTime:*`
   - Bucket size: 100ms

3. **Error Rate**:
   - Type: Line chart
   - Query: `level:error`
   - Time window: 1 hour
   - Alert threshold: > 10 errors/hour

### Alerts

Set up notifications for critical events:

1. **High Error Rate**:
   - Condition: `level:error` count > 50 in 5 minutes
   - Action: Send email/Slack notification

2. **API Failures**:
   - Condition: `action:API_ERROR AND module:"anthropic"`
   - Action: PagerDuty alert

3. **Sensitive Operations**:
   - Condition: `action:SENSITIVE_COMMAND`
   - Action: Audit log notification

## Log Structure

Each log entry contains:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "correlationId": "req_abc123def456",
  "action": "COMMAND_EXECUTED",
  "userId": "123456789",
  "username": "@johndoe",
  "sessionId": "sess_xyz789",
  "module": "trading",
  "command": "/position",
  "result": "success",
  "duration": 245,
  "performance": {
    "responseTime": 245,
    "apiCalls": {
      "hyperliquid": 2,
      "anthropic": 1
    }
  },
  "context": {
    "platform": "telegram",
    "userTier": "premium",
    "commandCount": 15
  },
  "metadata": {
    "fullName": "John Doe",
    "responseLength": 1024
  }
}
```

## Best Practices

### 1. Use Correlation IDs
Always include correlation IDs for tracing requests across services:
```typescript
const logger = createLogger({ 
  correlationId: createCorrelationId() 
});
```

### 2. Track Performance
Use timers for performance monitoring:
```typescript
logger.startTimer('api_call');
// ... perform operation
const duration = logger.endTimer('api_call');
```

### 3. Audit Sensitive Operations
Log all sensitive actions for compliance:
```typescript
logger.logSensitive('/admin/delete', authorized, result);
```

### 4. Structured Metadata
Include relevant context in metadata:
```typescript
logger.info(LogAction.TRADE_ANALYSIS_REQUESTED, {
  metadata: {
    symbol: 'BTC-USD',
    timeframe: '1h',
    indicators: ['RSI', 'MACD']
  }
});
```

## Monitoring Checklist

### Daily Monitoring
- [ ] Check error rate trends
- [ ] Review response time percentiles (p50, p95, p99)
- [ ] Monitor API rate limit warnings
- [ ] Check for unusual user activity patterns

### Weekly Analysis
- [ ] Review command usage statistics
- [ ] Analyze performance bottlenecks
- [ ] Check log volume against quota
- [ ] Review and update saved views

### Monthly Review
- [ ] Audit sensitive operations log
- [ ] Review and adjust alert thresholds
- [ ] Analyze user engagement metrics
- [ ] Plan capacity based on growth trends

## Troubleshooting

### Logs Not Appearing in Better Stack

1. **Check Token Configuration**:
   ```bash
   echo $BETTERSTACK_SOURCE_TOKEN
   ```

2. **Verify Network Connectivity**:
   - Ensure firewall allows HTTPS to logs.betterstack.com
   - Check proxy settings if applicable

3. **Test with Debug Mode**:
   ```bash
   LOG_LEVEL=trace npm run dev
   ```

### High Log Volume

1. **Adjust Log Level**:
   ```env
   LOG_LEVEL=warn  # Only warnings and errors
   ```

2. **Filter Specific Actions**:
   - Modify logger to skip certain actions
   - Use sampling for high-frequency events

### Performance Impact

1. **Use Async Logging**:
   - Logs are sent asynchronously by default
   - Monitor `flushLogs()` duration

2. **Batch Size**:
   - Logtail automatically batches logs
   - Default batch size is optimal for most cases

## Cost Management

### Free Tier Limits
- **Volume**: 1GB/month
- **Retention**: Unlimited
- **Sources**: 10
- **Team Members**: 3
- **Alerts**: Unlimited

### Optimization Tips
1. **Use appropriate log levels** - Don't log debug in production
2. **Compress metadata** - Only include essential information
3. **Sample high-volume events** - Log every Nth occurrence
4. **Archive old logs** - Export and store externally if needed

## Security Considerations

### Sensitive Data Redaction
The logger automatically redacts:
- API keys and tokens
- Passwords
- Authorization headers
- User personal information (configurable)

### Compliance
- Audit logs retained for 7 years
- GDPR-compliant data handling
- SOC 2 Type II certified infrastructure
- End-to-end encryption

## Next Steps

1. **Set up dashboards** for your specific use cases
2. **Configure alerts** for critical events
3. **Create saved views** for common queries
4. **Integrate with incident management** (PagerDuty, Opsgenie)
5. **Export logs** for long-term archival if needed

## Additional Resources

- [Better Stack Documentation](https://betterstack.com/docs)
- [Logtail Node.js Guide](https://betterstack.com/docs/logs/node-js)
- [Query Language Reference](https://betterstack.com/docs/logs/query-language)
- [Alert Configuration](https://betterstack.com/docs/logs/alerting)