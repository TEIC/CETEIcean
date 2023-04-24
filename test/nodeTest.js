import { JSDOM } from 'jsdom';
import CETEI from '../src/CETEI.js';

const jdom = new JSDOM(`<TEI xmlns="http://www.tei-c.org/ns/1.0"><div>test</div></TEI>`, {contentType: 'text/xml'});
const teiDoc = jdom.window.document;

const test = () => {
  console.log('Get HTML5 from JSDOM');
  const processedTEI = (new CETEI({documentObject: teiDoc})).domToHTML5(teiDoc);
  if (processedTEI) {
    console.log(' > pass');
  } else {
    console.log(' > fail');
    return;
  }
  console.log('Check content');
  if (processedTEI.querySelector("tei-div")) {
    console.log(' > pass');
  } else {
    console.log(' > fail');
  }
};

test();