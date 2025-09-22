# Grafana Dashboard Analysis with n8n

This directory contains a complete solution for automatically analyzing Grafana dashboards using n8n workflows and LLM integration.

## Files in this Directory

### 📚 Documentation
- **`grafana-dashboard-analysis-quickstart.md`** - Complete setup guide and usage instructions
- **`README.md`** - This overview file

### 🔧 Workflow
- **`grafana-dashboard-analysis-workflow.json`** - Ready-to-import n8n workflow

## Quick Overview

This solution provides an automated way to:

1. **Trigger via URL** - Send HTTP requests with Grafana dashboard parameters
2. **Fetch Dashboard Data** - Retrieve dashboard JSON from Grafana API
3. **Parse Panels** - Extract SQL queries and panel configurations
4. **AI Analysis** - Use LLM to describe each panel's purpose and functionality
5. **Generate Documentation** - Create comprehensive markdown documentation

## Getting Started

1. **Read the Quick Start Guide**: Open `grafana-dashboard-analysis-quickstart.md` for detailed setup instructions

2. **Import the Workflow**: 
   - Copy the contents of `grafana-dashboard-analysis-workflow.json`
   - Import into your n8n instance
   - Configure credentials for Grafana and LLM

3. **Test the Workflow**:
   ```bash
   curl "https://your-n8n-instance.com/webhook/grafana-analysis?grafana_url=https://grafana.example.com&dashboard_uid=your-dashboard-uid&api_token=your-api-token"
   ```

## Example Output

The workflow generates markdown documentation like this:

```markdown
# Dashboard Analysis: Application Performance Overview

## Dashboard Summary
**Title**: Application Performance Overview
**UID**: abc123def
**Tags**: monitoring, performance, application

## Panel Analysis

### 1. CPU Usage Over Time
**Type**: Time Series
**SQL Query**: 
```sql
SELECT time, avg(cpu_usage_percent) as cpu_avg
FROM metrics 
WHERE time >= now() - 24h
GROUP BY time(5m)
```

**Description**: This panel displays average CPU usage across application servers...
```

## Key Features

- ✅ **URL-triggered workflow** - Easy integration with other systems
- ✅ **Grafana API integration** - Fetches live dashboard data
- ✅ **Panel parsing** - Extracts SQL queries and metadata
- ✅ **LLM analysis** - Intelligent description of panel functionality
- ✅ **Markdown output** - Professional documentation format
- ✅ **Error handling** - Robust error responses
- ✅ **Configurable LLM** - Support for Groq, OpenAI, and other providers

## Use Cases

- **Documentation Generation** - Automatically document dashboard purposes
- **Knowledge Transfer** - Help team members understand complex dashboards
- **Audit and Compliance** - Track what metrics are being monitored
- **Dashboard Optimization** - Identify unused or inefficient panels
- **Training Materials** - Generate educational content about monitoring

## Requirements

- n8n instance (self-hosted or cloud)
- Grafana instance with API access
- LLM provider (Groq, OpenAI, etc.)
- Basic understanding of n8n workflows

## Support

For detailed instructions, troubleshooting, and customization options, see the [Quick Start Guide](./grafana-dashboard-analysis-quickstart.md).

For technical support:
- n8n Community: https://community.n8n.io
- n8n Documentation: https://docs.n8n.io
- Grafana API Docs: https://grafana.com/docs/grafana/latest/http_api/

## Contributing

This solution can be extended with:
- Additional panel types support
- More LLM providers
- Enhanced output formats (HTML, PDF)
- Integration with documentation platforms
- Custom analysis prompts
- Performance optimizations

Feel free to modify the workflow and documentation to fit your specific needs!