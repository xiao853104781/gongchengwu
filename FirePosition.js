let map;
let markers = []; // 存储标记对象
let infoWindow; // 全局信息窗体对象
function mapInit() {
  map = new AMap.Map('container', {
    resizeEnable: true,
    rotateEnable: false,
    pitchEnable: false,
    zoom: 15,
    pitch: 55,
    rotation: 45,
    viewMode: '3D',
    expandZoomRange: true,
    zooms: [3, 20],
    center: [106.39, 29.84],
    terrain: true,
  });
  map.addControl(new AMap.ControlBar({
    showZoomBar: false,
    showControlButton: true,
    position: {
      right: '10px',
      top: '10px'
    }
  }));
  // 创建全局信息窗体对象
  infoWindow = new AMap.InfoWindow({
    offset: new AMap.Pixel(0, -25)
  });
}
function markLocations() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) {
    alert('请先选择一个文件');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet['!ref']);

    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';

    markers.forEach(marker => marker.setMap(null)); // 清除之前的标记
    markers = [];

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const newRow = document.createElement('tr');

      // 添加checkbox
      const checkboxCell = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkboxCell.appendChild(checkbox);
      newRow.appendChild(checkboxCell);

      // 读取并添加其他列的数据
      const rowData = [];
      for (let col = 0; col < 6; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cellData = sheet[cellAddress];
        const cellValue = cellData ? cellData.v : '';
        rowData.push(cellValue);

        const newCell = document.createElement('td');
        newCell.textContent = cellValue;
        newRow.appendChild(newCell);
      }

      tableBody.appendChild(newRow);

      const [FID, longitude, latitude, starttime, depth, scale] = rowData;
      // 火灾级别颜色映射
      function getColorFromScale(scale) {
        if (scale < 5) {
          return 'green';
        } else if (scale < 6) {
          return 'yellow';
        } else {
          return 'red';
        }
      }
      //标记
      if (!isNaN(longitude) && !isNaN(latitude)) {
        const color = getColorFromScale(scale);
        const markerDiv = document.createElement('div');
        markerDiv.style.width = '26px';
        markerDiv.style.height = '26px';
        markerDiv.style.backgroundColor = color;
        markerDiv.style.borderRadius = '50%';
        markerDiv.style.position = 'absolute';
        markerDiv.style.left = '-50%';
        markerDiv.style.top = '-50%';
        // 创建标记并设置内容
        const marker = new AMap.Marker({
          position: [longitude, latitude],
          content: markerDiv,
          anchor: 'middle',
          offset: new AMap.Pixel(0, 0),
          zIndex: 100, // 设置标记的堆叠顺序，确保它在其他标记或覆盖物之上
        });
        map.add(marker);
        markers.push(marker);

        checkbox.addEventListener('change', ((markerRef) => {
          return function () {
            if (this.checked) {
              markerRef.show();
            } else {
              markerRef.hide();
            }
          };
        })(marker));

        const infoContent = `
                    <b>火点信息</b><br>
                    火点序号：${FID}<br>
                    经度：${longitude}<br>
                    纬度：${latitude}<br>
                    开始时间：${starttime}<br>
                    深度：${depth}<br>
                    级数：${scale}
                `;

        marker.on('click', function () {
          infoWindow.setContent(infoContent);
          infoWindow.open(map, marker.getPosition());
        });
      }
    }
  };

  reader.readAsArrayBuffer(file);
}
document.addEventListener('DOMContentLoaded', function () {
  mapInit();
});
