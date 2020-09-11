const express = require('express');
const router = express.Router();
const fs = require('fs');
const msg = {
	success: {errMsg: 'ok'},
	fail: {errMsg: 'fail'}
};
/**
 * [mergeChunk 全并切片]
 * @param  {[type]} dist   [目标文件]
 * @param  {[type]} source [源文件]
 * @return {[type]}        [description]
 */
async function mergeChunk(wStream, source) {
	return new Promise((resolve, reject) => {
		let rStream = fs.createReadStream(source);
		rStream.pipe(wStream, {end: false});
		rStream.on('error', (e) => {
			wStream.close();
			reject(msg.fail);
			console.log('合并失败');
		});
		rStream.on('end', (e) => {
			resolve(msg.success);
			console.log('合并成功');
		});
	});
}
/**
 * [saveFileChunk 保存文件分片]
 * @param  {[type]} path   [路径]
 * @param  {[type]} buffer [文件内容]
 * @return {[type]}        [description]
 */
async function saveFileChunk(path, buffer) {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, buffer, (err) => {
			if (err) {
				reject(msg.fail);
			} else {
				resolve(msg.success);
			}
		})
	})
}
/**
 * [deleteFileChunk 删除文件]
 * @param  {[type]} path  [路径]
 * @param  {[type]} total [个数]
 * @return {[type]}       [description]
 */
async function deleteFileChunk(path, total) {
	for(let v of [...'a'.repeat(total)].map((v, k) => k + 1)) {
		fs.unlink(`${path}${v}`, (err) => {
			if (err) console.log(err);
		});
	}
}

/* GET upload listing. */
router.post('/', async function(req, res, next) {
	let {num, total, fileName} = req.body,
			{buffer} = req.files[0],
			path = `./uploads/${fileName}`;
	try {
		let saveRes = await saveFileChunk(`${path}.part${num}`, buffer).catch((e) => msg.fail);
		if (saveRes.errMsg === 'fail') {
			res.status(500).json(msg.fail);
		} else {
			// 上传完成开始合并
			if (num === total) {
				let wStream = fs.createWriteStream(path);
				for(let v of [...'a'.repeat(total)].map((v, k) => k + 1)) {
					let mergeRes = await mergeChunk(wStream, `${path}.part${v}`).catch((e) => msg.fail);
					if (mergeRes.errMsg === 'fail') {
						res.status(500).json(msg.fail);
						break;
					}
				}
				wStream.close();
				deleteFileChunk(`${path}.part`, total);
				res.status(200).json(msg.success);
			} else {
				res.status(200).json(msg.success);
			}
		}
	} catch(e) {
		console.log(e);
		res.status(500).json(msg.fail);
	}
});

module.exports = router;