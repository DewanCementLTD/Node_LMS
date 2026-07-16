const fs = require('fs');
const http = require('http');
const https = require('https');

const makeRequest = (url, method, body, isHttps) => {
  return new Promise((resolve, reject) => {
    const lib = isHttps ? https : http;
    const reqUrl = new URL(url);
    const options = {
      hostname: reqUrl.hostname,
      port: reqUrl.port,
      path: reqUrl.pathname + reqUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
        resolve({ statusCode: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
};

function formatJson(obj) {
  if (typeof obj !== 'object' || obj === null) return String(obj);
  
  if (obj.items && Array.isArray(obj.items) && obj.items.length > 5) {
    const truncated = {
      items: obj.items.slice(0, 3),
      _note: `... truncated ${obj.items.length - 3} items for readability`
    };
    return JSON.stringify(truncated, null, 2);
  }
  return JSON.stringify(obj, null, 2);
}

function escapeHtmlForTable(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/ /g, '&nbsp;');
}

function getInvolvedTables(method, path) {
  const cleanPath = path.replace(/^\/|\/$/g, '').toLowerCase();
  
  if (cleanPath.startsWith('reference/departments')) return '`HR_DEPT`';
  if (cleanPath.startsWith('reference/grades')) return '`HR_GRADE_CD`';
  if (cleanPath.startsWith('reference/designations')) return '`HR_DESG`';
  if (cleanPath.startsWith('reference/emp-statuses')) return '`HR_EMP_STATUS`';
  if (cleanPath.startsWith('reference/bank-branches')) return '`HR_BRANCH`';
  if (cleanPath.startsWith('reference/banks')) {
    if (method === 'DELETE') return '`HR_BANK`, `HR_BRANCH` (cascade deletion of bank branches)';
    return '`HR_BANK`';
  }
  if (cleanPath.startsWith('reference/qualifications')) return '`HR_EMP_QUALIFICATION`';
  if (cleanPath.startsWith('reference/shifts')) return '`SHIFT_HEAD`';
  if (cleanPath.startsWith('reference/shift-lov')) return '`HR_SHIFT`';
  if (cleanPath.startsWith('reference/blood-groups')) return '`BLOOD_GROUP`';
  if (cleanPath.startsWith('reference/cadre')) return '`CADRE`';
  if (cleanPath.startsWith('reference/units')) return '`UNIT_MST`';
  if (cleanPath.startsWith('reference/religions')) return '`HR_EMP_MASTER` (reads distinct religion values)';
  if (cleanPath.startsWith('reference/reporting-officers')) return '`HR_EMP_MASTER` (reads active reporting officers)';
  if (cleanPath.startsWith('reference/locations')) return '`COM_LOCATION`';

  return 'Unknown';
}

async function run() {
  const collection = JSON.parse(fs.readFileSync('clean_collection.json', 'utf-8'));
  let md = '# Reference API Comparison: Localhost vs Live\n\n';
  md += `*Generated automatically on ${new Date().toISOString()}*\n`;
  md += `*Admin Card Number used: 100001.1*\n`;
  md += `*Note: All admin authorized requests also query authentication/validation tables: \`HR_EMP_MASTER\`, \`EMPLOYEE\`, \`SEC_USERNAME\`.*\n\n`;
  
  const groups = {};
  for (const item of collection.item) {
    const isLocal = item.name.includes('[Local]');
    const name = item.name.replace('[Local] ', '').replace('[Live] ', '');
    if (!groups[name]) {
      groups[name] = { 
        method: item.request.method, 
        path: item.request.url.path.join('/'), 
        query: item.request.url.query.map(q => `${q.key}=${q.value}`).join('&'), 
        body: item.request.body?.raw 
      };
    }
    if (isLocal) groups[name].localUrl = item.request.url.raw;
    else groups[name].liveUrl = item.request.url.raw;
  }

  for (const [name, info] of Object.entries(groups)) {
    const localUrlObj = new URL(info.localUrl);
    const fullRouteWithParams = `${info.method} ${localUrlObj.pathname}${localUrlObj.search}`;

    md += `### Route: ${fullRouteWithParams}\n`;
    md += `**Database Table(s):** ${getInvolvedTables(info.method, info.path)}\n\n`;
    
    md += `**Body:**\n`;
    if (info.body) {
      md += `**req obj:**\n\`\`\`json\n${info.body}\n\`\`\`\n\n`;
    } else {
      md += `**req obj:** None\n\n`;
    }

    let localStatus = 'N/A';
    let localDataFormatted = '';
    try {
      const localRes = await makeRequest(info.localUrl, info.method, info.body, false);
      localStatus = localRes.statusCode;
      localDataFormatted = formatJson(localRes.data);
    } catch(e) { 
      localDataFormatted = `Error: ${e.message}`; 
    }

    let liveStatus = 'N/A';
    let liveDataFormatted = '';
    try {
      const liveRes = await makeRequest(info.liveUrl, info.method, info.body, true);
      liveStatus = liveRes.statusCode;
      liveDataFormatted = formatJson(liveRes.data);
    } catch(e) { 
      liveDataFormatted = `Error: ${e.message}`; 
    }

    md += `| res obj for local (Status: ${localStatus}) | res obj for live (Status: ${liveStatus}) |\n`;
    md += `| :--- | :--- |\n`;
    md += `| <pre>${escapeHtmlForTable(localDataFormatted)}</pre> | <pre>${escapeHtmlForTable(liveDataFormatted)}</pre> |\n\n`;
    
    md += `---\n\n`;
  }
  
  fs.writeFileSync('reference_comparison_results.md', md);
  console.log('Saved reference_comparison_results.md');
}

run();
