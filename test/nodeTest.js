import { JSDOM } from 'jsdom';
import CETEI from '../src/CETEI.ts';
import fs from 'fs';

const tei = fs.readFileSync('test/testTEI.xml', 'utf8');
const jdom = new JSDOM(tei, {contentType: 'text/xml'});
const teiDoc = jdom.window.document;

const test = () => {
  console.log('Get HTML5 from JSDOM');
  const c = new CETEI({documentObject: teiDoc});
  const processedTEI = c.domToHTML5(teiDoc);
  if (processedTEI) {
    console.log(' > pass');
  } else {
    console.log(' > fail');
    return;
  }
  console.log('Check content');
  if (processedTEI.querySelector("tei-p")) {
    console.log(' > pass');
  } else {
    console.log(' > fail');
  }
  console.log('Round-trip test');
  const roundTrip = new JSDOM(c.utilities.resetAndSerialize(processedTEI, false, false), {contentType: 'text/xml'}).window.document;
  if (teiDoc.querySelectorAll('*').length === roundTrip.querySelectorAll('*').length) {
    console.log(' > pass');
  } else {
    console.log(' > fail');
  }
};

test();