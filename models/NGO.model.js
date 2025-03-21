const dataDir = path.join(__dirname, 'Data');
const ngodbPath = path.join(dataDir, 'ngos.json');

class NGO {
  readNGOs() {
    if (fs.existsSync(ngodbPath)) {
      try {
        const data = fs.readFileSync(ngodbPath);
        return data.length > 0 ? JSON.parse(data) : [];
      } catch (error) {
        console.error("Error parsing ngos.json:", error);
        return [];
      }
    }
    return [];
  }

  writeNGOs(data) {
    try {
      fs.writeFileSync(ngodbPath, JSON.stringify(data, null, 2));
      console.log("NGO data written successfully");
    } catch (error) {
      console.error("Error writing NGO data:", error);
    }
  }
}
