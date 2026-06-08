async function loadBarang(){

    const response = await fetch('http://localhost:3000/barang');

    const data = await response.json();

    const list = document.getElementById('barang-list');

    list.innerHTML = '';

    data.forEach(barang => {

        list.innerHTML += `
            <div class="barang">
                <h3>${barang.nama_barang}</h3>
                <p>Stok: ${barang.stok}</p>
                <p>Kondisi: ${barang.kondisi_barang}</p>
            </div>
        `;

    });

}

async function pinjamBarang(){

    const data = {
        id_user: document.getElementById('id_user').value,
        id_barang: document.getElementById('id_barang').value,
        tanggal_pinjam: document.getElementById('tanggal_pinjam').value,
        tanggal_kembali: document.getElementById('tanggal_kembali').value
    };

    const response = await fetch(
        'http://localhost:3000/peminjaman/tambah',
        {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        }
    );

    const result = await response.json();

    alert(result.message);

}

loadBarang();