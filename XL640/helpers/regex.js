const parameterRegexMap = {
    "CRE": /\|\^\^\^CRE\|([^\|\n]+)/,
    "PRO": /\|\^\^\^PRO\|([^\|\n]+)/,
    "BID": /\|\^\^\^BID\|([^\|\n]+)/,
    "BIT": /\|\^\^\^BIT\|([^\|\n]+)/,
    "GGT": /\|\^\^\^GGT\|([^\|\n]+)/,
    "SGOT": /\|\^\^\^SGOT\|([^\|\n]+)/,
    "A-AMY": /\|\^\^\^A-AMY\|([^\|\n]+)/,
    "ALT": /\|\^\^\^ALT\|([^\|\n]+)/,
    "AST": /\|\^\^\^AST\|([^\|\n]+)/,
    "ALP": /\|\^\^\^ALP\|([^\|\n]+)/,
    "TP": /\|\^\^\^TP\|([^\|\n]+)/,
    "TC": /\|\^\^\^TC\|([^\|\n]+)/,
    "UREA": /\|\^\^\^UREA\|([^\|\n]+)/,
    "GLU-O": /\|\^\^\^GLU-O\|([^\|\n]+)/,
    "TBIL-DSA": /\|\^\^\^RBIL-DSA\|([^\|\n]+)/,
    "DBIL-DSA": /\|\^\^\^DBIL-DSA\|([^\|\n]+)/,
    "UA": /\|\^\^\^UA\|([^\|\n]+)/,
    "TG": /\|\^\^\^TG\|([^\|\n]+)/,
    "ALB": /\|\^\^\^ALB\|([^\|\n]+)/,
    "CREA-J": /\|\^\^\^CREA-J\|([^\|\n]+)/,
    "LDH": /\|\^\^\^LDH\|([^\|\n]+)/,
    "P": /\|\^\^\^P\|([^\|\n]+)/,
    "CK": /\|\^\^\^CK\|([^\|\n]+)/,
    "A-HBDH": /\|\^\^\^A-HBDH\|([^\|\n]+)/,
    "R-GT": /\|\^\^\^R-GT\|([^\|\n]+)/,
    "CA": /\|\^\^\^CA\|([^\|\n]+)/,
    "MG": /\|\^\^\^MG\|([^\|\n]+)/,
    "TBIL-VOX": /\|\^\^\^TBIL-VOX\|([^\|\n]+)/,
    "DBIL-VOX": /\|\^\^\^DBIL-VOX\|([^\|\n]+)/,
    "GLU-HK": /\|\^\^\^GLU-HK\|([^\|\n]+)/,
    "HDL-C": /\|\^\^\^HDL-C\|([^\|\n]+)/,
    "LDL-C": /\|\^\^\^LDL-C\|([^\|\n]+)/,
    "CREA-S": /\|\^\^\^CREA-S\|([^\|\n]+)/,
    "CRP": /\|\^\^\^CRP\|([^\|\n]+)/
};

module.exports = { parameterRegexMap }
