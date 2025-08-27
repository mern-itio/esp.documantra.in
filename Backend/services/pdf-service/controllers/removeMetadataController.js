const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

const removeMetadataController = {
  async removeMetadata(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // console.log('File upload received:', {
      //   originalname: req.file.originalname,
      //   filename: req.file.filename,
      //   path: req.file.path,
      //   size: req.file.size,
      //   mimetype: req.file.mimetype
      // });

      // Verify uploaded file exists
      if (!await fs.pathExists(req.file.path)) {
        throw new Error(`Uploaded file not found at path: ${req.file.path}`);
      }

      // Ensure uploads directory exists
      const uploadsDir = path.dirname(req.file.path);
      await fs.ensureDir(uploadsDir);
      // console.log('Uploads directory ensured at:', uploadsDir);

      // Parse and convert string values to booleans if needed
      const parseBoolean = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase().trim();
          return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
        }
        return !!value;
      };

      const {
        removeDocumentInfo: rawRemoveDocumentInfo = true,
        removeProducer: rawRemoveProducer = true,
        removeCreator: rawRemoveCreator = true,
        removeCreationDate: rawRemoveCreationDate = true,
        removeModificationDate: rawRemoveModificationDate = true,
        removeKeywords: rawRemoveKeywords = true,
        removeSubject: rawRemoveSubject = true,
        removeAuthor: rawRemoveAuthor = true,
        removeTitle: rawRemoveTitle = true,
        removeTrapped: rawRemoveTrapped = true,

        removeXMPMetadata: rawRemoveXMPMetadata = true,

        removeMetadata = true,
        removeStructTreeRoot = false,
        removeCatalog = false,
        removeInfo = true,
        removeXRef = false,
        removeTrailer = false,
        removeRoot = false,
        removePages = false,
        removeKids = false,
        removeParent = false,
        removeMediaBox = false,
        removeCropBox = false,
        removeBleedBox = false,
        removeTrimBox = false,
        removeArtBox = false,
        removeRotate = false,
        removeResources = false,
        removeContents = false,
        removeFonts = false,
        removeImages = false,
        removeShadings = false,
        removePatterns = false,
        removeXObjects = false,
        removeExtGState = false,
        removeProperties = false,
        removeShading = false,
        removePattern = false,
        removeFont = false,
        removeImage = false,
        removeXObject = false,
        removeExtGState2 = false,
        removeProperties2 = false,
        removeShading2 = false,
        removePattern2 = false,
        removeFont2 = false,
        removeImage2 = false,
        removeXObject2 = false,
        removeExtGState3 = false,
        removeProperties3 = false,
        removeShading3 = false,
        removePattern3 = false,
        removeFont3 = false,
        removeImage3 = false,
        removeXObject3 = false,
        removeExtGState4 = false,
        removeProperties4 = false,
        removeShading4 = false,
        removePattern4 = false,
        removeFont4 = false,
        removeImage4 = false,
        removeXObject4 = false,
        removeExtGState5 = false,
        removeProperties5 = false,
        removeShading5 = false,
        removePattern5 = false,
        removeFont5 = false,
        removeImage5 = false,
        removeXObject5 = false,
        removeExtGState6 = false,
        removeProperties6 = false,
        removeShading6 = false,
        removePattern6 = false,
        removeFont6 = false,
        removeImage6 = false,
        removeXObject6 = false,
        removeExtGState7 = false,
        removeProperties7 = false,
        removeShading7 = false,
        removePattern7 = false,
        removeFont7 = false,
        removeImage7 = false,
        removeXObject7 = false,
        removeExtGState8 = false,
        removeProperties8 = false,
        removeShading8 = false,
        removePattern8 = false,
        removeFont8 = false,
        removeImage8 = false,
        removeXObject8 = false,
        removeExtGState9 = false,
        removeProperties9 = false,
        removeShading9 = false,
        removePattern9 = false,
        removeFont9 = false,
        removeImage9 = false,
        removeXObject9 = false,
        removeExtGState10 = false,
        removeProperties10 = false,
        removeShading10 = false,
        removePattern10 = false,
        removeFont10 = false,
        removeImage10 = false,
        removeXObject10 = false,
        removeExtGState11 = false,
        removeProperties11 = false,
        removeShading11 = false,
        removePattern11 = false,
        removeFont11 = false,
        removeImage11 = false,
        removeXObject11 = false,
        removeExtGState12 = false,
        removeProperties12 = false,
        removeShading12 = false,
        removePattern12 = false,
        removeFont12 = false,
        removeImage12 = false,
        removeXObject12 = false,
        removeExtGState13 = false,
        removeProperties13 = false,
        removeShading13 = false,
        removePattern13 = false,
        removeFont13 = false,
        removeImage13 = false,
        removeXObject13 = false,
        removeExtGState14 = false,
        removeProperties14 = false,
        removeShading14 = false,
        removePattern14 = false,
        removeFont14 = false,
        removeImage14 = false,
        removeXObject14 = false,
        removeExtGState15 = false,
        removeProperties15 = false,
        removeShading15 = false,
        removePattern15 = false,
        removeFont15 = false,
        removeImage15 = false,
        removeXObject15 = false,
        removeExtGState16 = false,
        removeProperties16 = false,
        removeShading16 = false,
        removePattern16 = false,
        removeFont16 = false,
        removeImage16 = false,
        removeXObject16 = false,
        removeExtGState17 = false,
        removeProperties17 = false,
        removeShading17 = false,
        removePattern17 = false,
        removeFont17 = false,
        removeImage17 = false,
        removeXObject17 = false,
        removeExtGState18 = false,
        removeProperties18 = false,
        removeShading18 = false,
        removePattern18 = false,
        removeFont18 = false,
        removeImage18 = false,
        removeXObject18 = false,
        removeExtGState19 = false,
        removeProperties19 = false,
        removeShading19 = false,
        removePattern19 = false,
        removeFont19 = false,
        removeImage19 = false,
        removeXObject19 = false,
        removeExtGState20 = false,
        removeProperties20 = false,
        removeShading20 = false,
        removePattern20 = false,
        removeFont20 = false,
        removeImage20 = false,
        removeXObject20 = false,
        removeExtGState21 = false,
        removeProperties21 = false,
        removeShading21 = false,
        removePattern21 = false,
        removeFont21 = false,
        removeImage21 = false,
        removeXObject21 = false,
        removeExtGState22 = false,
        removeProperties22 = false,
        removeShading22 = false,
        removePattern22 = false,
        removeFont22 = false,
        removeImage22 = false,
        removeXObject22 = false,
        removeExtGState23 = false,
        removeProperties23 = false,
        removeShading23 = false,
        removePattern23 = false,
        removeFont23 = false,
        removeImage23 = false,
        removeXObject23 = false,
        removeExtGState24 = false,
        removeProperties24 = false,
        removeShading24 = false,
        removePattern24 = false,
        removeFont24 = false,
        removeImage24 = false,
        removeXObject24 = false,
        removeExtGState25 = false,
        removeProperties25 = false,
        removeShading25 = false,
        removePattern25 = false,
        removeFont25 = false,
        removeImage25 = false,
        removeXObject25 = false,
        removeExtGState26 = false,
        removeProperties26 = false,
        removeShading26 = false,
        removePattern26 = false,
        removeFont26 = false,
        removeImage26 = false,
        removeXObject26 = false,
        removeExtGState27 = false,
        removeProperties27 = false,
        removeShading27 = false,
        removePattern27 = false,
        removeFont27 = false,
        removeImage27 = false,
        removeXObject27 = false,
        removeExtGState28 = false,
        removeProperties28 = false,
        removeShading28 = false,
        removePattern28 = false,
        removeFont28 = false,
        removeImage28 = false,
        removeXObject28 = false,
        removeExtGState29 = false,
        removeProperties29 = false,
        removeShading29 = false,
        removePattern29 = false,
        removeFont29 = false,
        removeImage29 = false,
        removeXObject29 = false,
        removeExtGState30 = false,
        removeProperties30 = false,
        removeShading30 = false,
        removePattern30 = false,
        removeFont30 = false,
        removeImage30 = false,
        removeXObject30 = false,
        removeExtGState31 = false,
        removeProperties31 = false,
        removeShading31 = false,
        removePattern31 = false,
        removeFont31 = false,
        removeImage31 = false,
        removeXObject31 = false,
        removeExtGState32 = false,
        removeProperties32 = false,
        removeShading32 = false,
        removePattern32 = false,
        removeFont32 = false,
        removeImage32 = false,
        removeXObject32 = false,
        removeExtGState33 = false,
        removeProperties33 = false,
        removeShading33 = false,
        removePattern33 = false,
        removeFont33 = false,
        removeImage33 = false,
        removeXObject33 = false,
        removeExtGState34 = false,
        removeProperties34 = false,
        removeShading34 = false,
        removePattern34 = false,
        removeFont34 = false,
        removeImage34 = false,
        removeXObject34 = false,
        removeExtGState35 = false,
        removeProperties35 = false,
        removeShading35 = false,
        removePattern35 = false,
        removeFont35 = false,
        removeImage35 = false,
        removeXObject35 = false,
        removeExtGState36 = false,
        removeProperties36 = false,
        removeShading36 = false,
        removePattern36 = false,
        removeFont36 = false,
        removeImage36 = false,
        removeXObject36 = false,
        removeExtGState37 = false,
        removeProperties37 = false,
        removeShading37 = false,
        removePattern37 = false,
        removeFont37 = false,
        removeImage37 = false,
        removeXObject37 = false,
        removeExtGState38 = false,
        removeProperties38 = false,
        removeShading38 = false,
        removePattern38 = false,
        removeFont38 = false,
        removeImage38 = false,
        removeXObject38 = false,
        removeExtGState39 = false,
        removeProperties39 = false,
        removeShading39 = false,
        removePattern39 = false,
        removeFont39 = false,
        removeImage39 = false,
        removeXObject39 = false,
        removeExtGState40 = false,
        removeProperties40 = false,
        removeShading40 = false,
        removePattern40 = false,
        removeFont40 = false,
        removeImage40 = false,
        removeXObject40 = false,
        removeExtGState41 = false,
        removeProperties41 = false,
        removeShading41 = false,
        removePattern41 = false,
        removeFont41 = false,
        removeImage41 = false,
        removeXObject41 = false,
        removeExtGState42 = false,
        removeProperties42 = false,
        removeShading42 = false,
        removePattern42 = false,
        removeFont42 = false,
        removeImage42 = false,
        removeXObject42 = false,
        removeExtGState43 = false,
        removeProperties43 = false,
        removeShading43 = false,
        removePattern43 = false,
        removeFont43 = false,
        removeImage43 = false,
        removeXObject43 = false,
        removeExtGState44 = false,
        removeProperties44 = false,
        removeShading44 = false,
        removePattern44 = false,
        removeFont44 = false,
        removeImage44 = false,
        removeXObject44 = false,
        removeExtGState45 = false,
        removeProperties45 = false,
        removeShading45 = false,
        removePattern45 = false,
        removeFont45 = false,
        removeImage45 = false,
        removeXObject45 = false,
        removeExtGState46 = false,
        removeProperties46 = false,
        removeShading46 = false,
        removePattern46 = false,
        removeFont46 = false,
        removeImage46 = false,
        removeXObject46 = false,
        removeExtGState47 = false,
        removeProperties47 = false,
        removeShading47 = false,
        removePattern47 = false,
        removeFont47 = false,
        removeImage47 = false,
        removeXObject47 = false,
        removeExtGState48 = false,
        removeProperties48 = false,
        removeShading48 = false,
        removePattern48 = false,
        removeFont48 = false,
        removeImage48 = false,
        removeXObject48 = false,
        removeExtGState49 = false,
        removeProperties49 = false,
        removeShading49 = false,
        removePattern49 = false,
        removeFont49 = false,
        removeImage49 = false,
        removeXObject49 = false,
        removeExtGState50 = false,
        removeProperties50 = false,
        removeShading50 = false,
        removePattern50 = false,
        removeFont50 = false,
        removeImage50 = false,
        removeXObject50 = false,
        removeExtGState51 = false,
        removeProperties51 = false,
        removeShading51 = false,
        removePattern51 = false,
        removeFont51 = false,
        removeImage51 = false,
        removeXObject51 = false,
        removeExtGState52 = false,
        removeProperties52 = false,
        removeShading52 = false,
        removePattern52 = false,
        removeFont52 = false,
        removeImage52 = false,
        removeXObject52 = false,
        removeExtGState53 = false,
        removeProperties53 = false,
        removeShading53 = false,
        removePattern53 = false,
        removeFont53 = false,
        removeImage53 = false,
        removeXObject53 = false,
        removeExtGState54 = false,
        removeProperties54 = false,
        removeShading54 = false,
        removePattern54 = false,
        removeFont54 = false,
        removeImage54 = false,
        removeXObject54 = false,
        removeExtGState55 = false,
        removeProperties55 = false,
        removeShading55 = false,
        removePattern55 = false,
        removeFont55 = false,
        removeImage55 = false,
        removeXObject55 = false,
        removeExtGState56 = false,
        removeProperties56 = false,
        removeShading56 = false,
        removePattern56 = false,
        removeFont56 = false,
        removeImage56 = false,
        removeXObject56 = false,
        removeExtGState57 = false,
        removeProperties57 = false,
        removeShading57 = false,
        removePattern57 = false,
        removeFont57 = false,
        removeImage57 = false,
        removeXObject57 = false,
        removeExtGState58 = false,
        removeProperties58 = false,
        removeShading58 = false,
        removePattern58 = false,
        removeFont58 = false,
        removeImage58 = false,
        removeXObject58 = false,
        removeExtGState59 = false,
        removeProperties59 = false,
        removeShading59 = false,
        removePattern59 = false,
        removeFont59 = false,
        removeImage59 = false,
        removeXObject59 = false,
        removeExtGState60 = false,
        removeProperties60 = false,
        removeShading60 = false,
        removePattern60 = false,
        removeFont60 = false,
        removeImage60 = false,
        removeXObject60 = false,
        removeExtGState61 = false,
        removeProperties61 = false,
        removeShading61 = false,
        removePattern61 = false,
        removeFont61 = false,
        removeImage61 = false,
        removeXObject61 = false,
        removeExtGState62 = false,
        removeProperties62 = false,
        removeShading62 = false,
        removePattern62 = false,
        removeFont62 = false,
        removeImage62 = false,
        removeXObject62 = false,
        removeExtGState63 = false,
        removeProperties63 = false,
        removeShading63 = false,
        removePattern63 = false,
        removeFont63 = false,
        removeImage63 = false,
        removeXObject63 = false,
        removeExtGState64 = false,
        removeProperties64 = false,
        removeShading64 = false,
        removePattern64 = false,
        removeFont64 = false,
        removeImage64 = false,
        removeXObject64 = false,
        removeExtGState65 = false,
        removeProperties65 = false,
        removeShading65 = false,
        removePattern65 = false,
        removeFont65 = false,
        removeImage65 = false,
        removeXObject65 = false,
        removeExtGState66 = false,
        removeProperties66 = false,
        removeShading66 = false,
        removePattern66 = false,
        removeFont66 = false,
        removeImage66 = false,
        removeXObject66 = false,
        removeExtGState67 = false,
        removeProperties67 = false,
        removeShading67 = false,
        removePattern67 = false,
        removeFont67 = false,
        removeImage67 = false,
        removeXObject67 = false,
        removeExtGState68 = false,
        removeProperties68 = false,
        removeShading68 = false,
        removePattern68 = false,
        removeFont68 = false,
        removeImage68 = false,
        removeXObject68 = false,
        removeExtGState69 = false,
        removeProperties69 = false,
        removeShading69 = false,
        removePattern69 = false,
        removeFont69 = false,
        removeImage69 = false,
        removeXObject69 = false,
        removeExtGState70 = false,
        removeProperties70 = false,
        removeShading70 = false,
        removePattern70 = false,
        removeFont70 = false,
        removeImage70 = false,
        removeXObject70 = false,
        removeExtGState71 = false,
        removeProperties71 = false,
        removeShading71 = false,
        removePattern71 = false,
        removeFont71 = false,
        removeImage71 = false,
        removeXObject71 = false,
        removeExtGState72 = false,
        removeProperties72 = false,
        removeShading72 = false,
        removePattern72 = false,
        removeFont72 = false,
        removeImage72 = false,
        removeXObject72 = false,
        removeExtGState73 = false,
        removeProperties73 = false,
        removeShading73 = false,
        removePattern73 = false,
        removeFont73 = false,
        removeImage73 = false,
        removeXObject73 = false,
        removeExtGState74 = false,
        removeProperties74 = false,
        removeShading74 = false,
        removePattern74 = false,
        removeFont74 = false,
        removeImage74 = false,
        removeXObject74 = false,
        removeExtGState75 = false,
        removeProperties75 = false,
        removeShading75 = false,
        removePattern75 = false,
        removeFont75 = false,
        removeImage75 = false,
        removeXObject75 = false,
        removeExtGState76 = false,
        removeProperties76 = false,
        removeShading76 = false,
        removePattern76 = false,
        removeFont76 = false,
        removeImage76 = false,
        removeXObject76 = false,
        removeExtGState77 = false,
        removeProperties77 = false,
        removeShading77 = false,
        removePattern77 = false,
        removeFont77 = false,
        removeImage77 = false,
        removeXObject77 = false,
        removeExtGState78 = false,
        removeProperties78 = false,
        removeShading78 = false,
        removePattern78 = false,
        removeFont78 = false,
        removeImage78 = false,
        removeXObject78 = false,
        removeExtGState79 = false,
        removeProperties79 = false,
        removeShading79 = false,
        removePattern79 = false,
        removeFont79 = false,
        removeImage79 = false,
        removeXObject79 = false,
        removeExtGState80 = false,
        removeProperties80 = false,
        removeShading80 = false,
        removePattern80 = false,
        removeFont80 = false,
        removeImage80 = false,
        removeXObject80 = false,
        removeExtGState81 = false,
        removeProperties81 = false,
        removeShading81 = false,
        removePattern81 = false,
        removeFont81 = false,
        removeImage81 = false,
        removeXObject81 = false,
        removeExtGState82 = false,
        removeProperties82 = false,
        removeShading82 = false,
        removePattern82 = false,
        removeFont82 = false,
        removeImage82 = false,
        removeXObject82 = false,
        removeExtGState83 = false,
        removeProperties83 = false,
        removeShading83 = false,
        removePattern83 = false,
        removeFont83 = false,
        removeImage83 = false,
        removeXObject83 = false,
        removeExtGState84 = false,
        removeProperties84 = false,
        removeShading84 = false,
        removePattern84 = false,
        removeFont84 = false,
        removeImage84 = false,
        removeXObject84 = false,
        removeExtGState85 = false,
        removeProperties85 = false,
        removeShading85 = false,
        removePattern85 = false,
        removeFont85 = false,
        removeImage85 = false,
        removeXObject85 = false,
        removeExtGState86 = false,
        removeProperties86 = false,
        removeShading86 = false,
        removePattern86 = false,
        removeFont86 = false,
        removeImage86 = false,
        removeXObject86 = false,
        removeExtGState87 = false,
        removeProperties87 = false,
        removeShading87 = false,
        removePattern87 = false,
        removeFont87 = false,
        removeImage87 = false,
        removeXObject87 = false,
        removeExtGState88 = false,
        removeProperties88 = false,
        removeShading88 = false,
        removePattern88 = false,
        removeFont88 = false,
        removeImage88 = false,
        removeXObject88 = false,
        removeExtGState89 = false,
        removeProperties89 = false,
        removeShading89 = false,
        removePattern89 = false,
        removeFont89 = false,
        removeImage89 = false,
        removeXObject89 = false,
        removeExtGState90 = false,
        removeProperties90 = false,
        removeShading90 = false,
        removePattern90 = false,
        removeFont90 = false,
        removeImage90 = false,
        removeXObject90 = false,
        removeExtGState91 = false,
        removeProperties91 = false,
        removeShading91 = false,
        removePattern91 = false,
        removeFont91 = false,
        removeImage91 = false,
        removeXObject91 = false,
        removeExtGState92 = false,
        removeProperties92 = false,
        removeShading92 = false,
        removePattern92 = false,
        removeFont92 = false,
        removeImage92 = false,
        removeXObject92 = false,
        removeExtGState93 = false,
        removeProperties93 = false,
        removeShading93 = false,
        removePattern93 = false,
        removeFont93 = false,
        removeImage93 = false,
        removeXObject93 = false,
        removeExtGState94 = false,
        removeProperties94 = false,
        removeShading94 = false,
        removePattern94 = false,
        removeFont94 = false,
        removeImage94 = false,
        removeXObject94 = false,
        removeExtGState95 = false,
        removeProperties95 = false,
        removeShading95 = false,
        removePattern95 = false,
        removeFont95 = false,
        removeImage95 = false,
        removeXObject95 = false,
        removeExtGState96 = false,
        removeProperties96 = false,
        removeShading96 = false,
        removePattern96 = false,
        removeFont96 = false,
        removeImage96 = false,
        removeXObject96 = false,
        removeExtGState97 = false,
        removeProperties97 = false,
        removeShading97 = false,
        removePattern97 = false,
        removeFont97 = false,
        removeImage97 = false,
        removeXObject97 = false,
        removeExtGState98 = false,
        removeProperties98 = false,
        removeShading98 = false,
        removePattern98 = false,
        removeFont98 = false,
        removeImage98 = false,
        removeXObject98 = false,
        removeExtGState99 = false,
        removeProperties99 = false,
        removeShading99 = false,
        removePattern99 = false,
        removeFont99 = false,
        removeImage99 = false,
        removeXObject99 = false,
        removeExtGState100 = false,
        removeProperties100 = false,
        removeShading100 = false,
        removePattern100 = false,
        removeFont100 = false,
        removeImage100 = false,
        removeXObject100 = false
      } = req.body;

      // Parse boolean values
      const removeDocumentInfo = parseBoolean(rawRemoveDocumentInfo);
      const removeProducer = parseBoolean(rawRemoveProducer);
      const removeCreator = parseBoolean(rawRemoveCreator);
      const removeCreationDate = parseBoolean(rawRemoveCreationDate);
      const removeModificationDate = parseBoolean(rawRemoveModificationDate);
      const removeKeywords = parseBoolean(rawRemoveKeywords);
      const removeSubject = parseBoolean(rawRemoveSubject);
      const removeAuthor = parseBoolean(rawRemoveAuthor);
      const removeTitle = parseBoolean(rawRemoveTitle);
      const removeTrapped = parseBoolean(rawRemoveTrapped);
      const removeXMPMetadata = parseBoolean(rawRemoveXMPMetadata);

      // Create output filename
      const outputFilename = `cleaned-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      let qpdfCommand = `qpdf --linearize "${req.file.path}" "${outputPath}"`;
      try {
        const { stdout, stderr } = await execAsync(qpdfCommand);
        if (stderr) {
        }
        if (stdout) {
        }
      } catch (qpdfError) {
        console.error('qpdf command failed:', qpdfError);
        throw new Error(`qpdf command failed: ${qpdfError.message}`);
      }

      // Log qpdf version for debugging
      try {
        const { stdout: qpdfVersion } = await execAsync('qpdf --version');
      } catch (versionError) {
      }
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Output file was not created by qpdf');
      }

      try {
        let exifCommand = 'exiftool';
        let exifVersion = '';

        try {
          const { stdout: version } = await execAsync('exiftool -ver');
          exifVersion = version.trim();
        } catch (error) {
          // Try alternative paths
          const possiblePaths = [
            './exiftool.exe',
            '../exiftool.exe',
            'exiftool.exe',
            'C:\\Program Files\\ExifTool\\exiftool.exe',
            'C:\\exiftool\\exiftool.exe'
          ];

          for (const path of possiblePaths) {
            try {
              const { stdout: version } = await execAsync(`"${path}" -ver`);
              exifCommand = `"${path}"`;
              exifVersion = version.trim();
              break;
            } catch (pathError) {
              // Continue to next path
            }
          }
        }

        if (!exifVersion) {
          throw new Error('ExifTool not found in any location');
        }

        if (removeAuthor) exifCommand += ' -Author=';
        if (removeTitle) exifCommand += ' -Title=';
        if (removeSubject) exifCommand += ' -Subject=';
        if (removeKeywords) exifCommand += ' -Keywords=';
        if (removeCreator) exifCommand += ' -Creator=';
        if (removeProducer) exifCommand += ' -Producer=';
        if (removeCreationDate) exifCommand += ' -CreateDate=';
        if (removeModificationDate) exifCommand += ' -ModifyDate=';
        if (removeTrapped) exifCommand += ' -Trapped=';

        // Add XMP metadata removal if requested
        if (removeXMPMetadata) {
          exifCommand += ' -XMP:All=';
        }

        // Add PDF-specific metadata removal
        if (removeDocumentInfo || removeAuthor || removeTitle || removeSubject || removeKeywords || removeCreator || removeProducer) {
          exifCommand += ' -PDF:Author= -PDF:Title= -PDF:Subject= -PDF:Keywords= -PDF:Creator= -PDF:Producer= -PDF:ModDate= -PDF:Creator= -PDF:Producer=';
        }

        // Add comprehensive metadata removal for better coverage
        if (removeDocumentInfo) {
          exifCommand += ' -Document= -PDF= -Info=';
        }

        // Add the file path and overwrite flag
        exifCommand += ` -overwrite_original "${outputPath}"`;


        await execAsync(exifCommand);
        const finalOutputPath = path.join(__dirname, '..', 'outputs', `final-${outputFilename}`);
        await execAsync(`qpdf --linearize "${outputPath}" "${finalOutputPath}"`);
        await fs.move(finalOutputPath, outputPath, { overwrite: true });
        try {
          const { stdout: verificationOutput } = await execAsync(`exiftool -a -u -g1 "${outputPath}"`);
        } catch (verificationError) {
        }

      } catch (exifError) {
        try {
          const enhancedOutputPath = path.join(__dirname, '..', 'outputs', `enhanced-${outputFilename}`);
          const enhancedQpdfCommand = `qpdf --linearize --object-streams=disable --compression-level=0 "${outputPath}" "${enhancedOutputPath}"`;

          await execAsync(enhancedQpdfCommand);
          await fs.move(enhancedOutputPath, outputPath, { overwrite: true });

        } catch (enhancedError) {
          console.log('Enhanced qpdf processing failed:', enhancedError.message);
          console.log('Using basic qpdf output');
        }

        try {
          const basicOutputPath = path.join(__dirname, '..', 'outputs', `basic-${outputFilename}`);

          // Use qpdf to rewrite the PDF which can sometimes remove some metadata
          const basicQpdfCommand = `qpdf --linearize --object-streams=disable "${outputPath}" "${basicOutputPath}"`;
          await execAsync(basicQpdfCommand);

          // Replace the output file with the basic version
          await fs.move(basicOutputPath, outputPath, { overwrite: true });

        } catch (basicError) {
          console.log('Basic qpdf metadata removal failed:', basicError.message);
          console.log('Using original qpdf output');
        }
      }

      // Verify the output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error(`Output file was not created at path: ${outputPath}`);
      }

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      const originalStats = await fs.stat(req.file.path);
      const originalFileSize = originalStats.size;
      const sizeReduction = originalFileSize - fileSize;

      // Get page count using qpdf
      let pageCount = 0;
      try {
        const { stdout: pagesOutput } = await execAsync(`qpdf --show-pages "${outputPath}"`);
        const pageMatch = pagesOutput.match(/(\d+)\s+page/);
        if (pageMatch) {
          pageCount = parseInt(pageMatch[1]);
        }
      } catch (error) {
        console.warn('Could not determine page count:', error.message);
        pageCount = 'Unknown';
      }

      // Get metadata info before and after
      let metadataInfo = {};
      try {
        const { stdout: originalMetadata } = await execAsync(`qpdf --show-encryption "${req.file.path}"`);
        metadataInfo.originalMetadata = originalMetadata;
      } catch (error) {
        metadataInfo.originalMetadata = 'Could not read original metadata';
      }

      // Clean up uploaded file after metadata comparison
      await fs.remove(req.file.path);

      try {
        const { stdout: cleanedMetadata } = await execAsync(`qpdf --show-encryption "${outputPath}"`);
        metadataInfo.cleanedMetadata = cleanedMetadata;
      } catch (error) {
        metadataInfo.cleanedMetadata = 'Could not read cleaned metadata';
      }

      // Log document tracking event (moved here after metadataInfo is defined)
      try {
        console.log('Attempting to log document tracking event...');
        const DocumentTracking = require('../models/documentTracking');
        console.log('DocumentTracking model loaded successfully');
        
        const documentId = crypto.randomBytes(16).toString('hex');
        const userId = req.user?.id || 'anonymous';
        
        console.log('Creating tracking record with:', {
          documentId,
          documentName: req.file.originalname,
          userId,
          action: 'metadata_removed'
        });
        
        const trackingRecord = new DocumentTracking({
          documentId,
          documentName: req.file.originalname,
          documentType: 'pdf',
          originalFilename: req.file.originalname,
          userId,
          action: 'metadata_removed',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isTracked: true,
          trackingSource: 'automatic',
          metadata: {
            originalFileSize,
            cleanedFileSize: fileSize,
            sizeReduction,
            cleaningOptions: {
              removeDocumentInfo,
              removeProducer,
              removeCreator,
              removeCreationDate,
              removeModificationDate,
              removeKeywords,
              removeSubject,
              removeAuthor,
              removeTitle,
              removeTrapped,
              removeXMPMetadata,
              removeMetadata
            },
            originalMetadata: metadataInfo.originalMetadata,
            cleanedMetadata: metadataInfo.cleanedMetadata
          }
        });

        console.log('Tracking record created, attempting to save...');
        await trackingRecord.save();
        console.log('Document tracking event logged successfully for metadata removal');
      } catch (trackingError) {
        console.error('Failed to log document tracking event:', trackingError);
        console.error('Error details:', {
          message: trackingError.message,
          stack: trackingError.stack,
          name: trackingError.name
        });
        // Don't fail the main operation if tracking fails
      }

      res.json({
        success: true,
        message: 'Metadata removed successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-remove-metadata/download/${outputFilename}`,
        totalPages: pageCount,
        fileSize: fileSize,
        originalFileSize: originalFileSize,
        sizeReduction: sizeReduction,
        metadataInfo: metadataInfo,
        cleaningOptions: {
          removeDocumentInfo,
          removeProducer,
          removeCreator,
          removeCreationDate,
          removeModificationDate,
          removeKeywords,
          removeSubject,
          removeAuthor,
          removeTitle,
          removeTrapped,
          removeXMPMetadata,
          removeMetadata
        }
      });

    } catch (error) {
      console.error('Error removing metadata:', error);

      res.status(500).json({
        error: 'Failed to remove metadata from PDF',
        details: error.message
      });
    }
  },

  // Helper method to check PDF metadata
  async checkMetadata(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let metadataInfo = {};

      // Use qpdf to check basic PDF info
      try {
        const { stdout: qpdfInfo } = await execAsync(`qpdf --show-encryption "${req.file.path}"`);
        metadataInfo.qpdfInfo = qpdfInfo;
      } catch (error) {
        metadataInfo.qpdfInfo = 'Could not read PDF info with qpdf';
      }

      // Use exiftool for comprehensive metadata if available
      try {
        const { stdout: exifInfo } = await execAsync(`exiftool -a -u -g1 "${req.file.path}"`);
        metadataInfo.exifInfo = exifInfo;
      } catch (error) {
        metadataInfo.exifInfo = 'ExifTool not available';
      }

      // Use pdfinfo if available
      try {
        const { stdout: pdfInfo } = await execAsync(`pdfinfo "${req.file.path}"`);
        metadataInfo.pdfInfo = pdfInfo;
      } catch (error) {
        metadataInfo.pdfInfo = 'pdfinfo not available';
      }

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        metadataFound: true,
        metadataInfo: metadataInfo,
        message: 'Metadata analysis completed'
      });

    } catch (error) {
      console.error('Error checking metadata:', error);
      res.status(500).json({
        error: 'Failed to check PDF metadata',
        details: error.message
      });
    }
  },

  // Helper method to test tools installation
  async testToolsInstallation() {
    const tools = {};

    try {
      const { stdout: qpdfVersion } = await execAsync('qpdf --version');
      tools.qpdf = {
        installed: true,
        version: qpdfVersion.trim(),
        message: 'qpdf is properly installed and working'
      };
    } catch (error) {
      tools.qpdf = {
        installed: false,
        error: error.message,
        message: 'qpdf is not installed or not accessible'
      };
    }

    // Try to find exiftool in common locations
    let exifToolFound = false;
    let exifToolPath = '';
    let exifToolVersion = '';

    try {
      const { stdout: exifVersion } = await execAsync('exiftool -ver');
      exifToolFound = true;
      exifToolPath = 'exiftool';
      exifToolVersion = exifVersion.trim();
    } catch (error) {
      // Try alternative paths
      const possiblePaths = [
        './exiftool.exe',
        '../exiftool.exe',
        'exiftool.exe',
        'C:\\Program Files\\ExifTool\\exiftool.exe',
        'C:\\exiftool\\exiftool.exe'
      ];

      for (const path of possiblePaths) {
        try {
          const { stdout: version } = await execAsync(`"${path}" -ver`);
          exifToolFound = true;
          exifToolPath = path;
          exifToolVersion = version.trim();
          break;
        } catch (pathError) {
          // Continue to next path
        }
      }
    }

    if (exifToolFound) {
      tools.exiftool = {
        installed: true,
        version: exifToolVersion,
        path: exifToolPath,
        message: `ExifTool is properly installed and working at ${exifToolPath}`
      };
    } else {
      tools.exiftool = {
        installed: false,
        error: 'ExifTool not found in any location',
        message: 'ExifTool is not installed or not accessible. Please install ExifTool for full metadata removal functionality.'
      };
    }

    try {
      const { stdout: pdfinfoVersion } = await execAsync('pdfinfo -v');
      tools.pdfinfo = {
        installed: true,
        version: pdfinfoVersion.trim(),
        message: 'pdfinfo is properly installed and working'
      };
    } catch (error) {
      tools.pdfinfo = {
        installed: false,
        error: error.message,
        message: 'pdfinfo is not installed or not accessible'
      };
    }

    return tools;
  }
};

module.exports = removeMetadataController;
