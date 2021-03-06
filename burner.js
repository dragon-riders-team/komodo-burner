const bitGoUTXO = require('bitgo-utxo-lib');

// define available network
const komodoNetwork = {
  messagePrefix: '\x19Komodo Signed Message:\n',
  bip44: 141,
  bech32: 'bc',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x3c,
  scriptHash: 0x55,
  wif: 0xbc,
  consensusBranchId: {
    1: 0x00,
    2: 0x00,
    3: 0x5ba81b19,
    4: 0x76b809bb,
  },
  coin: 'zec'
}
const komodoNonSaplingNetwork = {
  messagePrefix: '\x18Komodo Signed Message:\n',
  bip32: {
    public: 0x0488B21E,
    private: 0x0488ADE4,
  },
  pubKeyHash: 0x3c,
  scriptHash: 0x55,
  wif: 0xbc,
}

// receive data, process, and write to output text box
window.process = function() {
  document.getElementById("text").innerText=""
  var formData = {}
  let form = document.getElementById("form")
  for (let i in form.elements) {
    let name = form.elements[i].name
    let value = form.elements[i].value
    let type = form.elements[i].type
    let checked = form.elements[i].checked
    if (name && name.length > 0 && value !== undefined) {
      formData[name] = type === 'checkbox' ? checked : value
    }
  }
  let tx = buildTx(formData)
  document.getElementById("text").innerText=tx
}

function buildTx(formData) {
  let fd = formData

  // determine selected network
  let overwinter = fd.isOverwintered
  let selectedNetwork = overwinter ? komodoNetwork : komodoNonSaplingNetwork

  // initialize transaction builder
  let builder = new bitGoUTXO.TransactionBuilder(selectedNetwork)
  if (overwinter) {
    builder.setVersion(bitGoUTXO.Transaction.ZCASH_SAPLING_VERSION)  // 4
    builder.setVersionGroupId(parseInt('0x892F2085', 16))
  }

  // data
  let keyPair = bitGoUTXO.ECPair.fromWIF(fd.privateKey, selectedNetwork)
  let hashType = bitGoUTXO.Transaction.SIGHASH_ALL

  // add input
  builder.addInput(fd.txid, Number(fd.prevOutIndex))

  // add output
  let dataBuffer = Buffer.from(fd.opreturnData)
  let dataScript = bitGoUTXO.script.nullData.output.encode(dataBuffer)
  let outputValueSat = Math.round(Number(fd.outputValue) * 100000000)
  let feeSat = Math.round(Number(fd.fee) * 100000000)
  builder.addOutput(dataScript, (outputValueSat - feeSat))

  // sign transaction
  builder.sign(0, keyPair, undefined, undefined, outputValueSat)
  let signedTx = builder.build()

  // return in hex format
  return signedTx.toHex()
}
