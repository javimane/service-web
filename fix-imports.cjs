const fs = require('fs');
const path = require('path');
const actionsDir = 'c:/Users/javim/Documents/Archivos/Proyecto App Comercial/service-web/src/app/actions';

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if(file !== '_utils') processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('import { buildActionHeaders "./_utils/authHeaders";')) {
        content = content.replace('import { buildActionHeaders "./_utils/authHeaders";', 'import { buildActionHeaders } from "./_utils/authHeaders";');
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}
processDir(actionsDir);
