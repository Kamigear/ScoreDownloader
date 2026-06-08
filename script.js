document.addEventListener('DOMContentLoaded', () => {
    const bookmarkletBtn = document.getElementById('bookmarklet-btn');
    
    const bookmarkletFunction = async function() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('songsterr.com')) {
            // Check if the overlay already exists to prevent duplicates
            if (document.getElementById('sgd-install-modal')) return;
            
            const overlay = document.createElement('div');
            overlay.id = 'sgd-install-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;justify-content:center;align-items:center;color:white;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;backdrop-filter:blur(8px);';
            
            overlay.innerHTML = `
                <div style="background:#1e1e1e; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid #333; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                    <div style="font-size: 40px; margin-bottom: 20px;">🎸</div>
                    <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #fff;">Songsterr Unlock Required</h2>
                    <p style="color: #a3a3a3; font-size: 15px; line-height: 1.5; margin-bottom: 30px;">
                        Because of modern web security, this bookmarklet cannot unlock Songsterr directly. To get all Plus features (and native PDF printing), you need to install a browser extension.
                    </p>
                    
                    <div style="text-align: left; background: #2a2a2a; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #fff;">Detailed Setup Guide:</h3>
                        <ol style="margin: 0; padding-left: 20px; color: #d4d4d4; font-size: 14px; line-height: 1.6;">
                            <li style="margin-bottom: 10px;">Download the <b>Tampermonkey</b> extension from your browser's extension store (Chrome, Edge, Safari, etc).</li>
                            <li style="margin-bottom: 10px;">Make sure Tampermonkey is enabled in your browser's Extensions settings.</li>
                            <li>Finally, click the blue <b>Install Script</b> button below!</li>
                        </ol>
                    </div>
                    
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="sgd-close-btn" style="padding: 12px 24px; border-radius: 10px; border: none; background: #333; color: white; font-weight: bold; cursor: pointer; transition: 0.2s;">Cancel</button>
                        <a href="https://update.greasyfork.org/scripts/564818/%F0%9F%8E%B8%20Songsterr%20Ultimate%20%28Premium%20Unlocked%29.user.js" target="_blank" style="padding: 12px 24px; border-radius: 10px; border: none; background: #2563eb; color: white; font-weight: bold; cursor: pointer; text-decoration: none; transition: 0.2s;">Install Script</a>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            document.getElementById('sgd-close-btn').addEventListener('click', () => {
                document.body.removeChild(overlay);
            });
            
            return;
        }
        
        if (!hostname.includes('musescore.com')) {
            alert('This bookmarklet only works on musescore.com or songsterr.com!');
            return;
        }
        
        /* Musescore Scraper Logic */
        if (!window.jspdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = runScraper;
            document.body.appendChild(script);
        } else {
            runScraper();
        }
        
        async function runScraper() {
            const { jsPDF } = window.jspdf;
            
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;justify-content:center;align-items:center;color:white;font-size:28px;font-family:sans-serif;flex-direction:column;backdrop-filter:blur(5px);';
            overlay.innerHTML = '<div style="margin-bottom:20px;font-weight:bold;color:#6366f1;">ScoreDownloader</div><div id="ms-progress" style="font-size:18px;color:#94a3b8;">Analyzing page structure...</div>';
            document.body.appendChild(overlay);
            
            const progress = document.getElementById('ms-progress');
            
            try {
                const urls = new Set();
                const scroller = document.getElementById('jmuse-scroller-component');
                if (!scroller) throw new Error("Could not find the score container.");
                
                const pageDivs = [];
                for (let el of Array.from(scroller.children)) {
                    if (el.id === 'score-scroll-purchase' || el.tagName.toLowerCase() === 'section') break;
                    if (el.tagName.toLowerCase() === 'div' && el.style.height) {
                        pageDivs.push(el);
                    }
                }
                
                if (pageDivs.length === 0) {
                    throw new Error("Could not find any score pages. Make sure you are on a score page!");
                }
                
                for (let i = 0; i < pageDivs.length; i++) {
                    const pageDiv = pageDivs[i];
                    progress.innerText = 'Loading page ' + (i + 1) + ' of ' + pageDivs.length + '...';
                    
                    pageDiv.scrollIntoView({ block: 'center' });
                    
                    let imgFound = false;
                    for (let attempts = 0; attempts < 20; attempts++) {
                        const img = pageDiv.querySelector('img');
                        if (img) {
                            const src = img.getAttribute('src');
                            if (src && src.includes('.svg')) {
                                urls.add(src);
                                imgFound = true;
                                break;
                            }
                        }
                        await new Promise(r => setTimeout(r, 200));
                    }
                    
                    if (!imgFound) {
                        console.warn("Could not load image for page " + (i + 1));
                    }
                }
                
                if (urls.size === 0) {
                    throw new Error("Could not extract any SVG URLs.");
                }
                
                const svgUrls = Array.from(urls).sort((a, b) => {
                    const matchA = a.match(/score_(\\d+)\\.svg/);
                    const matchB = b.match(/score_(\\d+)\\.svg/);
                    if (matchA && matchB) {
                        return parseInt(matchA[1]) - parseInt(matchB[1]);
                    }
                    return 0;
                });
                
                const pdf = new jsPDF('p', 'pt', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                for (let i = 0; i < svgUrls.length; i++) {
                    progress.innerText = 'Processing page ' + (i + 1) + ' of ' + svgUrls.length + '...';
                    
                    const imgResp = await fetch(svgUrls[i]);
                    if (!imgResp.ok) throw new Error('Failed to load page ' + (i+1));
                    const blob = await imgResp.blob();
                    const objUrl = URL.createObjectURL(blob);
                    
                    const img = await new Promise((resolve, reject) => {
                        const imgNode = new Image();
                        imgNode.onload = () => resolve(imgNode);
                        imgNode.onerror = () => reject(new Error('Failed to render page ' + (i+1)));
                        imgNode.src = objUrl;
                    });
                    
                    const canvas = document.createElement('canvas');
                    const scale = 2;
                    canvas.width = (img.width || 827) * scale;
                    canvas.height = (img.height || 1169) * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.scale(scale, scale);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, img.width || 827, img.height || 1169);
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    URL.revokeObjectURL(objUrl);
                }
                
                progress.innerText = 'Generating PDF...';
                let filename = document.title ? document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'musescore_download';
                pdf.save(filename + '.pdf');
                
                progress.innerText = 'Done! Check your downloads.';
                setTimeout(() => document.body.removeChild(overlay), 3000);
                
            } catch (err) {
                progress.style.color = '#ef4444';
                progress.innerText = 'Error: ' + err.message;
                setTimeout(() => document.body.removeChild(overlay), 5000);
            }
        }
    };
    
    const codeStr = '(' + bookmarkletFunction.toString() + ')();';
    bookmarkletBtn.href = "javascript:" + encodeURIComponent(codeStr);
    
    bookmarkletBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert("Drag this button to your Bookmarks Bar! Do not just click it here.");
    });
});
