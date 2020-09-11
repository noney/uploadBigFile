async function uploadBigFile(event) {
	let bigFile = event.target.files[0],
			chunkSize = 1024 * 1024,
			chunkArr = [],
			fr = new FileReader();
	for(let start = 0; start < bigFile.size; start += chunkSize) {
		chunkArr.push(bigFile.slice(start, start + chunkSize +1));
	}
	console.log(`开始上传`)
	console.time('上传用时：');
	for(let [k, v] of Object.entries(chunkArr)) {
		let fd = new FormData();
		fd.append('num', +k + 1);
		fd.append('fileName', bigFile.name);
		fd.append('total', chunkArr.length);
		fd.append(`file`, v);
		let uploadRes = await fetch('/upload', {method: 'post', body: fd}).catch((e) => {});
		try {
			uploadRes = JSON.parse(await uploadRes.text());
		} catch(e) {
			console.log(e);
		}
		if (uploadRes.errMsg !== 'ok') {
			console.log(`上传失败`);
			console.timeEnd('上传用时：');
			// break;
		} else if (+k + 1 === chunkArr.length) {
			console.log(`上传完成`);
			console.timeEnd('上传用时：');
		}
	}
}