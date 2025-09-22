# Grafana Dashboard Analysis - Quick Start Guide

This guide will help you set up an n8n workflow that automatically analyzes Grafana dashboards, extracts panel information, and generates comprehensive documentation using AI.

## Overview

The workflow creates an intelligent pipeline that:
1. **Receives a webhook request** with Grafana dashboard URL parameters
2. **Fetches dashboard JSON** from the Grafana API
3. **Parses panels** to extract SQL queries and configuration
4. **Analyzes each panel** using an LLM to describe functionality
5. **Generates markdown documentation** describing the entire dashboard

## Prerequisites

### Required n8n Nodes
- **Webhook** - For triggering the workflow
- **HTTP Request** - For fetching Grafana dashboard data
- **Code** - For parsing JSON and extracting panels
- **Groq Chat Model** (or other LLM) - For analyzing panels
- **Markdown** - For generating final documentation

### Required Credentials
- **Grafana API Token** - For accessing dashboard data
- **LLM API Key** - For panel analysis (Groq, OpenAI, etc.)

## Setup Instructions

### 1. Grafana Configuration

First, create a Grafana API token:
1. Log into your Grafana instance
2. Go to Configuration → API Keys
3. Create a new API key with at least "Viewer" permissions
4. Save the API key for n8n configuration

### 2. LLM Configuration

Set up your preferred LLM provider:
- **Groq**: Sign up at console.groq.com and get your API key
- **OpenAI**: Use your OpenAI API key
- **Other**: Configure your preferred LangChain-compatible LLM

### 3. n8n Workflow Import

Import the provided workflow JSON file into your n8n instance:
1. Open n8n workflow editor
2. Click "Import" and paste the workflow JSON
3. Configure credentials for Grafana and LLM nodes
4. Activate the workflow

## Workflow Components

### 1. Webhook Trigger
- **Purpose**: Receives URL parameters for dashboard analysis
- **Parameters**: 
  - `grafana_url`: Base Grafana URL
  - `dashboard_uid`: Dashboard UID to analyze
  - `api_token`: Grafana API token (optional if configured)

### 2. HTTP Request - Fetch Dashboard
- **Purpose**: Retrieves dashboard JSON from Grafana API
- **Method**: GET
- **URL**: `{{$node["Webhook"].json["query"]["grafana_url"]}}/api/dashboards/uid/{{$node["Webhook"].json["query"]["dashboard_uid"]}}`
- **Headers**: `Authorization: Bearer {{$node["Webhook"].json["query"]["api_token"]}}`

### 3. Code Node - Parse Panels
- **Purpose**: Extracts individual panels from dashboard JSON
- **Function**: 
  - Parses dashboard.panels array
  - Extracts SQL queries from panel targets
  - Organizes panel metadata

### 4. LLM Analysis
- **Purpose**: Analyzes each panel using AI
- **Prompt**: Describes SQL queries and panel functionality
- **Output**: Structured analysis of each panel

### 5. Markdown Generator
- **Purpose**: Compiles all analysis into documentation
- **Output**: Complete markdown document describing the dashboard

## Usage

### Basic Usage

1. **Trigger the workflow** by sending a GET request to your webhook URL:
   ```bash
   curl "https://your-n8n-instance.com/webhook/grafana-analysis?grafana_url=https://grafana.example.com&dashboard_uid=your-dashboard-uid&api_token=your-api-token"
   ```

2. **Receive markdown documentation** as the response

### Advanced Usage

#### Custom Analysis Prompts
Modify the LLM prompt to focus on specific aspects:
- SQL query optimization suggestions
- Performance analysis
- Data source relationships
- Business logic interpretation

#### Multiple Dashboard Analysis
Chain multiple dashboard requests by:
- Creating a loop for multiple dashboard UIDs
- Aggregating results across dashboards
- Generating comparative analysis

#### Integration with Documentation Systems
Connect the output to:
- GitLab/GitHub wikis
- Confluence
- Internal documentation platforms
- Email notifications

## Example Request and Response

### Request
```bash
curl "https://your-n8n-instance.com/webhook/grafana-analysis?grafana_url=https://grafana.company.com&dashboard_uid=abc123def&api_token=glsa_xxxxxxxxxxxxx"
```

### Response
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
SELECT 
  time,
  avg(cpu_usage_percent) as cpu_avg
FROM metrics 
WHERE time >= now() - 24h
GROUP BY time(5m)
```

**Description**: This panel displays the average CPU usage across all application servers over the last 24 hours, aggregated in 5-minute intervals. The query helps identify CPU usage patterns and potential performance bottlenecks.

### 2. Memory Utilization
**Type**: Gauge
**SQL Query**:
```sql
SELECT last(memory_used_bytes) / last(memory_total_bytes) * 100
FROM system_metrics 
WHERE time >= now() - 5m
```

**Description**: Shows current memory utilization as a percentage. This metric is critical for understanding memory pressure and potential out-of-memory conditions.

## Recommendations
- Consider adding alerting for CPU usage above 80%
- Memory utilization trending upward - investigate for memory leaks
- Add disk I/O metrics for complete system overview
```

## Troubleshooting

### Common Issues

1. **Grafana API Authentication**
   - Verify API token has correct permissions
   - Check Grafana URL format (no trailing slash)
   - Ensure dashboard UID is correct

2. **LLM API Limits**
   - Monitor API usage and rate limits
   - Implement retry logic for temporary failures
   - Consider using different models for cost optimization

3. **Panel Parsing Issues**
   - Some panel types may not have SQL queries
   - Handle different data source types appropriately
   - Validate JSON structure before processing

### Debugging Tips

1. **Enable Debug Mode**: Turn on debug logging in n8n workflow
2. **Test Components**: Test each node individually
3. **Validate JSON**: Check Grafana API response structure
4. **Monitor LLM Responses**: Ensure LLM provides expected analysis format

## Customization

### Extending the Workflow

1. **Add More Analysis Types**
   - Query performance analysis
   - Data freshness checks
   - Visualization recommendations

2. **Support More Panel Types**
   - Table panels
   - Bar charts
   - Stat panels
   - Text panels

3. **Enhanced Output Formats**
   - HTML reports
   - PDF generation
   - JSON structured data
   - CSV summaries

### Integration Examples

1. **Slack Notifications**
   - Add Slack node to send analysis summaries
   - Format key insights for team consumption

2. **Automated Documentation Updates**
   - Connect to Git repositories
   - Update documentation automatically
   - Version control dashboard documentation

3. **Monitoring Integration**
   - Create alerts based on analysis findings
   - Track documentation coverage
   - Monitor dashboard usage patterns

## Best Practices

1. **Security**
   - Store API tokens securely in n8n credentials
   - Use environment variables for sensitive data
   - Implement proper access controls

2. **Performance**
   - Cache dashboard data when possible
   - Limit concurrent LLM requests
   - Optimize large dashboard processing

3. **Reliability**
   - Implement error handling for all steps
   - Add retry logic for API calls
   - Monitor workflow execution success

## Support and Resources

- **n8n Documentation**: https://docs.n8n.io
- **Grafana API Docs**: https://grafana.com/docs/grafana/latest/http_api/
- **LangChain Integration**: https://docs.n8n.io/langchain/
- **Community Forum**: https://community.n8n.io

For issues and feature requests, please refer to the n8n community forum or create issues in the appropriate repositories.