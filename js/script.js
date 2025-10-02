let fehlzeitCounter = 0;
const fehlzeiten = [];

const fehlenArtRadios = document.querySelectorAll('input[name="fehlenArt"]');
const leistungCheck = document.getElementById('leistungsueberpruefung');
const nachholCheck = document.getElementById('nachholpruefung');

fehlenArtRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        addFehlzeit();
    });
});

function addFehlzeit() {
    const fehlenArt = document.querySelector('input[name="fehlenArt"]:checked')?.value;
    
    if (!fehlenArt) {
        alert('Bitte wähle zuerst eine Art des Fehlens aus!');
        return;
    }
    
    if (fehlzeiten.length >= 5) {
        alert('Es können maximal 5 Fehlzeiten hinzugefügt werden!');
        return;
    }
    
    const container = document.getElementById('fehlzeitenContainer');
    const fehlzeitDiv = document.createElement('div');
    fehlzeitDiv.className = 'fehlzeit-item';
    fehlzeitDiv.dataset.id = fehlzeitCounter;
    
    let fieldsHtml = '';
    
    if (fehlenArt === 'eintaetig') {
        fieldsHtml = `
            <h4>📅 Eintägiges Fehlen</h4>
            <button class="remove-btn" onclick="removeFehlzeit(${fehlzeitCounter})">×</button>
            <div class="form-group">
                <label>Datum:</label>
                <input type="date" id="datum_${fehlzeitCounter}" data-type="eintaetig">
            </div>
        `;
    } else if (fehlenArt === 'mehrtaetig') {
        fieldsHtml = `
            <h4>📅 Mehrtägiges Fehlen</h4>
            <button class="remove-btn" onclick="removeFehlzeit(${fehlzeitCounter})">×</button>
            <div class="row">
                <div class="form-group">
                    <label>Von:</label>
                    <input type="date" id="von_${fehlzeitCounter}" data-type="mehrtaetig">
                </div>
                <div class="form-group">
                    <label>Bis:</label>
                    <input type="date" id="bis_${fehlzeitCounter}" data-type="mehrtaetig">
                </div>
            </div>
        `;
    } else if (fehlenArt === 'einzelstunden') {
        fieldsHtml = `
            <h4>⏰ Einzelne Fehlstunden</h4>
            <button class="remove-btn" onclick="removeFehlzeit(${fehlzeitCounter})">×</button>
            <div class="form-group">
                <label>Datum:</label>
                <input type="date" id="datum_${fehlzeitCounter}" data-type="einzelstunden">
            </div>
            <div class="form-group">
                <label>Abwesende Stunde(n):</label>
                <input type="text" id="stunden_${fehlzeitCounter}" placeholder="z.B. 1-3">
            </div>
        `;
    } else if (fehlenArt === 'minuten') {
        fieldsHtml = `
            <h4>⏱️ Verspätung (Fehlminuten)</h4>
            <button class="remove-btn" onclick="removeFehlzeit(${fehlzeitCounter})">×</button>
            <div class="form-group">
                <label>Datum:</label>
                <input type="date" id="datum_${fehlzeitCounter}" data-type="minuten">
            </div>
            <div class="form-group">
                <label>Dauer der Verspätung:</label>
                <input type="text" id="dauer_${fehlzeitCounter}" placeholder="z.B. 15 Minuten">
            </div>
        `;
    }
    
    fehlzeitDiv.innerHTML = fieldsHtml;
    container.appendChild(fehlzeitDiv);
    
    fehlzeiten.push({
        id: fehlzeitCounter,
        type: fehlenArt
    });
    
    fehlzeitCounter++;
}

function removeFehlzeit(id) {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
        element.remove();
    }
    const index = fehlzeiten.findIndex(f => f.id === id);
    if (index > -1) {
        fehlzeiten.splice(index, 1);
    }
}

leistungCheck.addEventListener('change', updateFachField);
nachholCheck.addEventListener('change', updateFachField);

function updateGrund() {
    // Textfeld immer anzeigen
    document.getElementById('sonstiges_grund').style.display = 'block';
    updatePDF();
}

function updateFachField() {
    if (leistungCheck.checked || nachholCheck.checked) {
        document.getElementById('fachField').style.display = 'block';
    } else {
        document.getElementById('fachField').style.display = 'none';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE');
}

function isMobile() {
    return window.innerWidth <= 768;
}

async function generatePDF() {
    // Aktuelle Scrollposition speichern
    const scrollPos = window.scrollY;
    
    // Formular für PDF vorbereiten
    const element = document.getElementById('formOutput');
    const originalStyle = element.style.cssText;
    
    // Temporäre Styles für PDF-Generierung
    element.style.cssText = `
        width: 210mm !important;
        height: 297mm !important;
        padding: 25.4mm !important;
        margin: 0 !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        transform: none !important;
        background: white !important;
        font-size: 10.5pt !important;
        line-height: 1.2 !important;
        box-sizing: border-box !important;
    `;

    // Zum Seitenanfang scrollen
    window.scrollTo(0, 0);

    const opt = {
        margin: 0,
        filename: 'Entschuldigung.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
            scale: 4,
            useCORS: true,
            logging: true,
            backgroundColor: '#FFFFFF'
        },
        jsPDF: {
            unit: 'mm',
            format: [210, 297],
            orientation: 'portrait'
        }
    };

    // Temporär die mobile Transformation entfernen für die PDF-Generierung
    const originalTransform = element.style.transform;
    element.style.transform = 'none';

    try {
        await html2pdf().set(opt).from(element).save();
    } finally {
        // Ursprüngliche Styles und Scrollposition wiederherstellen
        element.style.cssText = originalStyle;
        window.scrollTo(0, scrollPos);
    }
}

function handlePrint() {
    window.print();
}

async function downloadPreview() {
    const element = document.getElementById('formOutput');
    
    // Aktuelle Scrollposition und Styles speichern
    const scrollPos = window.scrollY;
    const originalTransform = element.style.transform;
    
    try {
        // Styles für Screenshot anpassen
        element.style.transform = 'none';
        window.scrollTo(0, 0);
        
        // Screenshot erstellen und als PDF speichern
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false,
            windowWidth: 2480,
            windowHeight: 3508
        });
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        
        pdf.save('Entschuldigung.pdf');
    } finally {
        // Ursprünglichen Zustand wiederherstellen
        element.style.transform = originalTransform;
        window.scrollTo(0, scrollPos);
    }
}

function generateForm() {
    const name = document.getElementById('name').value || '';
    const klasse = document.getElementById('klasse').value || '';
    const lehrer = document.getElementById('lehrer').value || '';
    const grund = document.getElementById('grund').value || '';
    
    if (fehlzeiten.length === 0) {
        alert('Bitte füge mindestens eine Fehlzeit hinzu!');
        return;
    }
    
    if (fehlzeiten.length > 5) {
        alert('Es können maximal 5 Fehlzeiten hinzugefügt werden!');
        return;
    }
    
    // Alle Fehlzeiten sammeln
    let fehlzeitenHtml = '';
    
    fehlzeiten.forEach(fehlzeit => {
        const type = fehlzeit.type;
        const id = fehlzeit.id;
        
        if (type === 'eintaetig') {
            const datum = formatDate(document.getElementById(`datum_${id}`)?.value);
            fehlzeitenHtml += `
                <div class="checkbox-line fehlzeit-line">
                    <span class="checkbox checked"></span>
                    <strong>bei eintägigem Fehlzeiten</strong>
                    <div class="fehlzeit-details">am <span class="field">${datum}</span></div>
                </div>
            `;
        } else if (type === 'mehrtaetig') {
            const von = formatDate(document.getElementById(`von_${id}`)?.value);
            const bis = formatDate(document.getElementById(`bis_${id}`)?.value);
            fehlzeitenHtml += `
                <div class="checkbox-line fehlzeit-line">
                    <span class="checkbox checked"></span>
                    <strong>bei mehreren Fehltagen</strong>
                    <div class="fehlzeit-details">vom <span class="field">${von}</span> (vel.) bis <span class="field">${bis}</span></div>
                </div>
            `;
        } else if (type === 'einzelstunden') {
            const datum = formatDate(document.getElementById(`datum_${id}`)?.value);
            const stunden = document.getElementById(`stunden_${id}`)?.value || '';
            fehlzeitenHtml += `
                <div class="checkbox-line fehlzeit-line">
                    <span class="checkbox checked"></span>
                    <strong>bei einzelnen Fehlstunden</strong>
                    <div class="fehlzeit-details">am <span class="field">${datum}</span> Abwesende Stunde(n) <span class="field">${stunden}</span></div>
                </div>
            `;
        } else if (type === 'minuten') {
            const datum = formatDate(document.getElementById(`datum_${id}`)?.value);
            const dauer = document.getElementById(`dauer_${id}`)?.value || '';
            fehlzeitenHtml += `
                <div class="checkbox-line fehlzeit-line">
                    <span class="checkbox checked"></span>
                    <strong>bei Fehlminuten</strong>
                    <div class="fehlzeit-details">am <span class="field">${datum}</span> Dauer der Verspätung: <span class="field">${dauer}</span></div>
                </div>
            `;
        }
    });
    
    const attest = document.getElementById('attest').checked;
    const leistung = document.getElementById('leistungsueberpruefung').checked;
    const nachholpruefung = document.getElementById('nachholpruefung').checked;
    const fach = document.getElementById('fach').value || '';
    
    // Zusätzliche Informationen HTML nur für ausgewählte Optionen generieren
    let zusatzInfoHtml = '';
    zusatzInfoHtml = '<div class="zusatz-grid">';
    
    if (attest) {
        zusatzInfoHtml += `
            <div class="checkbox-line">
                <span class="checkbox checked"></span>
                Ein Attest bzw. eine Bescheinigung liegt bei (bitte hinten aufkleben).
            </div>
        `;
    }
    if (leistung) {
        zusatzInfoHtml += `
            <div class="checkbox-line">
                <span class="checkbox checked"></span>
                <span>Während der Fehlzeit fand eine angesagte Leistungsüberprüfung in <u>folg.</u> Fach/Fächern statt:</span>
            </div>
        `;
    }
    if (nachholpruefung) {
        zusatzInfoHtml += `
            <div class="checkbox-line">
                <span class="checkbox checked"></span>
                <span>Am dem Tag nach der Fehlzeit findet eine angesagte Leistungsüberprüfung in folgendem Fach/Fächern statt:</span>
            </div>
        `;
    }
    
    zusatzInfoHtml += '</div>';
    
    if (leistung || nachholpruefung) {
        zusatzInfoHtml += `
            <div class="fach-line" style="margin-top: 10px;">${fach}</div>
        `;
    }
    
    const html = `
        <div class="header">
            <div class="logo-section">
                <div class="logo">
                    <img src="https://www.fls-ulm.de/wp-content/uploads/2022/02/FLS.jpg" alt="FLS Logo">
                </div>
                <div class="school-name">Friedrich-List-Schule</div>
            </div>
            <div class="address">
                Kornhausplatz 7<br>
                89073 Ulm<br>
                www.fls-ulm.de
            </div>
        </div>
        
        <div style="margin: 35px 0 20px 0;">
            <strong>Eingangsdatum:</strong> <span class="field"></span>
            <span style="font-size: 10px; display: block; margin-top: 2px;">(vom Klassenlehrer/in auszufüllen bzw. Datumsstempel des Sekretariats)</span>
        </div>
        
        <div class="form-title" style="margin: 20px 0; font-size: 16px;">schriftliche Entschuldigung</div>
        
        <div class="form-content">
            Name: <span class="field">${name}</span>
            <span style="float: right;">Klasse: <span class="field">${klasse}</span></span>
        </div>
        
        <div style="margin: 15px 0;">
            Sehr geehrte/r <span class="field">${lehrer}</span>,
        </div>
        
        <div style="margin: 20px 0;">
            bitte entschuldigen Sie mein Unterrichtsversäumnis / das Fehlen meines Kindes
        </div>
        
        <div class="fehlzeit-section">
            ${fehlzeitenHtml}
        </div>
        
        <div class="grund-line" style="margin: 25px 0 15px">
            <strong style="white-space: nowrap;">Grund des Fehlens:</strong>
            <div class="grund-options" style="margin-left: -10px;">
                <div class="grund-option">
                    <span class="checkbox${document.getElementById('grund_krankheit').checked ? ' checked' : ''}"></span>
                    Krankheit
                </div>
                <div class="grund-option">
                    <span class="checkbox${document.getElementById('grund_arzt').checked ? ' checked' : ''}"></span>
                    Arztbesuch
                </div>
                <div class="grund-option">
                    <span class="checkbox${document.getElementById('grund_beurlaubung').checked ? ' checked' : ''}"></span>
                    Beurlaubung
                </div>
                <div class="grund-option">
                    <span class="checkbox${document.getElementById('grund_sonstiges').checked ? ' checked' : ''}"></span>
                    Sonstiges
                </div>
            </div>
        </div>
        
        <div class="reason-box">
            ${grund}
        </div>
        
        <div class="zusatz-section">
            ${zusatzInfoHtml}
        </div>
        
        <div class="form-footer">
            <div class="signatures">
                <div class="signature-field">
                    <div class="signature-line"></div>
                    Tag, Datum
                </div>
                <div class="signature-field">
                    <div class="signature-line"></div>
                    Unterschrift Erziehungsberechtigte/r bzw.<br>Schüler/in
                </div>
                <div class="signature-field">
                    <div class="signature-line"></div>
                    Unterschrift Klassenlehrer/in
                </div>
            </div>
            
            <div class="note">
                Hinweise: Dieser Entschuldigung ist ggf. eine ärztliche Bescheinigung auf der Rückseite aufzukleben. Falls beim Formular "bei eintätigem Fehlzeiten" angekreuzt ist, ist die FLS-Entschuldigungsregelung zu berücksichtigen und das Formular auf der Homepage der FLS herunterladbar und drucken.
            </div>
        </div>
    `;
    
    document.getElementById('formOutput').innerHTML = html;
    document.getElementById('outputSection').classList.add('active');
    document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth' });
}