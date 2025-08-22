#!/usr/bin/env node

// 测试正则表达式匹配

const header16 = "父亲姓名、电话、身份证号";
const header17 = "母亲姓名、电话、身份证号";

const patterns = {
    'fatherInfo': /父亲姓名、电话、身份证号|父亲.*姓名|父亲.*信息|父亲/,
    'motherInfo': /母亲姓名、电话、身份证号|母亲.*姓名|母亲.*信息|母亲/
};

console.log('🧪 正则表达式匹配测试');
console.log('====================');

console.log(`父亲表头: "${header16}"`);
console.log(`母亲表头: "${header17}"`);

console.log('\n测试结果:');
console.log(`fatherInfo 模式匹配: ${patterns.fatherInfo.test(header16)}`);
console.log(`motherInfo 模式匹配: ${patterns.motherInfo.test(header17)}`);

// 测试各个分量
console.log('\n详细匹配测试:');
const fatherTests = [
    /父亲姓名、电话、身份证号/,
    /父亲.*姓名/,
    /父亲.*信息/,
    /父亲/
];

const motherTests = [
    /母亲姓名、电话、身份证号/,
    /母亲.*姓名/,
    /母亲.*信息/,
    /母亲/
];

fatherTests.forEach((pattern, index) => {
    console.log(`父亲模式${index+1} ${pattern} -> ${pattern.test(header16)}`);
});

motherTests.forEach((pattern, index) => {
    console.log(`母亲模式${index+1} ${pattern} -> ${pattern.test(header17)}`);
});