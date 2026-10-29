// Served in place of lib/supabase.js (landing + app) on 127.0.0.1 only.
(function(){
  var F = window.__FAKE_SB || {};
  var user = { id:'00000000-0000-4000-8000-000000000001', email:'simi.test@example.test', created_at:'2026-03-02T10:00:00Z', aud:'authenticated', role:'authenticated', app_metadata:{provider:'email'}, user_metadata:{} };
  user.identities = [{ provider:'email', identity_id:'id-email' }].concat((F.identities||[]).map(function(p){ return { provider:p, identity_id:'id-'+p }; }));   // Stage 5c
  function signedSession(){ return { access_token:'fake.jwt.token', refresh_token:'fake-refresh', token_type:'bearer', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600, user:user }; }
  var session = F.signedOut ? null : signedSession();
  var profile = { id:user.id, email:user.email, display_name:'Simi', role: F.role || 'user', active_cert:'secplus', exam_date:'2026-11-20', created_at:'2026-03-02T10:00:00Z', updated_at:'2026-10-16T12:00:00Z',
    metadata: Object.assign({
      entitlements:{ secplus:{tier:'pro', source:'stripe'} }, tier:'pro', plan:'pro_annual',
      cert_results:{ secplus:{status:'passed', score:800, max_score:900, pass_score:750, date:'2026-10-16', centre:'Pearson VUE · London Bridge', created_at:'2026-10-16T15:00:00Z', updated_at:'2026-10-16T15:00:00Z'} },
      nplus_readiness_snapshots:{ secplus:{score:812, computed_at:'2026-10-15T09:00:00Z', weak_domain:'Security Operations'}, netplus:{score:640, computed_at:'2026-09-01T09:00:00Z', weak_domain:'Network Troubleshooting'} }
    }, F.metaOverride || {}) };
  if (F.noResults) delete profile.metadata.cert_results;
  try { if (F.deletionCancelled && !localStorage.getItem('__fakeNoticeCleared')) profile.metadata.deletion_cancelled_at = '2026-10-29T09:00:00Z'; } catch(e){}   // Account deletion: the trigger's flag, until clear_deletion_notice runs
  if (F.accountFreeCert) profile.metadata.freeCertId = F.accountFreeCert;
  if (F.displayName !== undefined) profile.display_name = F.displayName;   // Stage 5c: null = no name yet   // Stage 5b: the account's free exam
  window.__fakeLog = [];
  function resolve(st){
    window.__fakeLog.push(st.table+':'+st.op);
    if (st.op==='update' && st.table==='profiles' && st.val && st.val.display_name){ try { localStorage.setItem('__fakeDisplayName', st.val.display_name); } catch(e){} }   // Stage 5c
    if (st.op==='update' && st.table==='profiles' && st.val && st.val.metadata){ try { var w=JSON.parse(localStorage.getItem('__fakeFreeCertWrites')||'[]'); w.push(st.val.metadata.freeCertId==null?null:st.val.metadata.freeCertId); localStorage.setItem('__fakeFreeCertWrites', JSON.stringify(w)); } catch(e){} }   // Stage 5b: survives navigation
    if (st.op==='update' && st.table==='profiles'){ if (st.val && st.val.metadata) profile.metadata = st.val.metadata; Object.keys(st.val||{}).forEach(function(k){ if(k!=='metadata') profile[k]=st.val[k]; }); return {data:null,error:null,status:204}; }
    if (st.op!=='select') return {data:null,error:null,status:201};
    if (st.table==='profiles' && F.profileError && session) return {data:null, error:{message:'profile read failed', code:'500'}};
    var rows = [];
    if (st.table==='profiles') rows=[profile];
    else if (st.table==='subscriptions') rows = F.subs || [{ user_id:user.id, status:'active', plan:'pro_annual', price_id:'price_test', current_period_end:'2027-06-08T00:00:00Z', cancel_at_period_end:false }];
    else if (st.table==='cert_entitlements' || st.table==='entitlements') rows=[{user_id:user.id, cert_id:'secplus', tier:'pro'}];
    if (st.single) return {data:rows[0]||null, error: rows[0]?null:{code:'PGRST116',message:'no rows'}};
    return {data:rows, error:null, count:rows.length};
  }
  function qb(table){
    var st={table:table, op:'select', single:false}; var p={};
    ['select','eq','neq','in','order','limit','gte','lte','gt','lt','is','filter','match','range','not','or','contains','ilike','like'].forEach(function(m){ p[m]=function(){ if(m==='select' && st.op==='select'){} return p; }; });
    p.update=function(v){st.op='update';st.val=v;return p;}; p.insert=function(v){st.op='insert';st.val=v;return p;}; p.upsert=function(v){st.op='upsert';st.val=v;return p;}; p.delete=function(){st.op='delete';return p;};
    p.single=function(){st.single=true;return p;}; p.maybeSingle=function(){st.single=true;return p;};
    p.then=function(a,b){ var d=(st.table==='profiles' && st.op==='select' && F.profileDelay && session) ? F.profileDelay : 0; return new Promise(function(r){ setTimeout(function(){ r(resolve(st)); }, d); }).then(a,b); }; p.catch=function(b){ return p.then(null,b); }; p.finally=function(f){ return p.then(function(v){f();return v;}); };
    return p;
  }
  var listeners=[];
  var client = {
    from: qb,
    // Account deletion: rpc names land in localStorage __rpcCalls (survives navigation). F.rpcError / F.rpcNull make request_account_deletion fail / return NULL.
    // Lazy like supabase-js's PostgrestFilterBuilder: nothing is recorded or applied until .then runs, so an un-chained rpc() (which never sends in production) shows up as a missing call.
    rpc: function(name){ var run=function(){ window.__fakeLog.push('rpc:'+name); try{ var rc=JSON.parse(localStorage.getItem('__rpcCalls')||'[]'); rc.push(name); localStorage.setItem('__rpcCalls',JSON.stringify(rc)); }catch(e){}
      var d=null; if(name==='get_daily_quota_usage') d=[F.tier==='free'?{used:0,limit:15,tier:'free'}:{used:0,limit:-1,tier:'pro'}];
      if(name==='request_account_deletion'){ if(F.rpcError) return {data:null,error:{message:'rpc failed',code:'500'}}; if(F.rpcNull) return {data:null,error:null}; d=new Date().toISOString(); profile.metadata.deletion_requested_at=d; }
      if(name==='clear_deletion_notice'){ delete profile.metadata.deletion_cancelled_at; try{ localStorage.setItem('__fakeNoticeCleared','1'); }catch(e){} }
      return {data:d,error:null}; };
      var q={ then:function(a,b){ return Promise.resolve().then(run).then(a,b); }, catch:function(b){ return q.then(null,b); } }; return q; },
    functions:{ invoke:function(n){ window.__fakeLog.push('fn:'+n); return Promise.resolve({data:null,error:null}); } },
    channel:function(){ var c={on:function(){return c;},subscribe:function(){return c;},unsubscribe:function(){}}; return c; }, removeChannel:function(){},
    storage:{ from:function(){ return { upload:function(){return Promise.resolve({data:null,error:null});}, download:function(){return Promise.resolve({data:null,error:null});} }; } },
    auth:{
      getSession:function(){ return Promise.resolve({data:{session:session},error:null}); },
      getUser:function(){ return Promise.resolve({data:{user:session?user:null},error:null}); },
      onAuthStateChange:function(cb){ listeners.push(cb); setTimeout(function(){ try{cb('INITIAL_SESSION',session);}catch(e){} },0); return {data:{subscription:{unsubscribe:function(){}}}}; },
      // Account deletion: F.signOutError makes a global sign-out resolve {error} (supabase-js on a network failure keeps the session).
      signOut:function(opts){ var sc=(opts && opts.scope) || 'local'; window.__fakeLog.push('auth:signOut:'+sc);
        if (F.signOutError && sc==='global') return Promise.resolve({error:{message:'Failed to fetch',status:0,name:'AuthRetryableFetchError'}});
        return Promise.resolve({error:null}); },
      signInWithOtp:function(o){ o=o||{}; window.__fakeLog.push('auth:otp'); window.__fakeLog.push('auth:otp:'+o.email+':'+!!(o.options&&o.options.emailRedirectTo));
        if (F.otpStatus!=null) return Promise.resolve({data:{},error:{message:'send refused',status:F.otpStatus,name:F.otpStatus===0?'AuthRetryableFetchError':'AuthApiError'}});
        return Promise.resolve({data:{},error: F.otpError?{message:F.otpError,status:400}:null}); },
      // Stage 5c: the website's redirect sign-in; calls land in localStorage __oauthCalls (no navigation).
      signInWithOAuth:function(o){ o=o||{}; try{ var c=JSON.parse(localStorage.getItem('__oauthCalls')||'[]'); c.push({provider:o.provider,redirectTo:(o.options||{}).redirectTo||null}); localStorage.setItem('__oauthCalls',JSON.stringify(c)); }catch(e){}
        return Promise.resolve({data:{provider:o.provider,url:'about:blank'},error:null}); },
      // Stage 5c: Settings → Sign-in methods. __FAKE_SB.linkError: 'identity_already_exists' | 'other'.
      linkIdentity:function(o){ o=o||{}; try{ var c=JSON.parse(localStorage.getItem('__linkCalls')||'[]'); c.push({provider:o.provider,token:o.token,nonce:o.nonce||null}); localStorage.setItem('__linkCalls',JSON.stringify(c)); }catch(e){}
        if (F.linkError==='identity_already_exists') return Promise.resolve({data:null,error:{message:'Identity is already linked to another user',code:'identity_already_exists',status:422,name:'AuthApiError'}});
        if (F.linkError) return Promise.resolve({data:null,error:{message:'link failed',status:500,name:'AuthApiError'}});
        user.identities.push({ provider:o.provider, identity_id:'id-'+o.provider }); listeners.forEach(function(cb){ try{ cb('USER_UPDATED',session); }catch(e){} });
        return Promise.resolve({data:{user:user,session:session},error:null}); },
      // Stage 5c: an identity token from the native sheet. __FAKE_SB.idTokenError refuses it; calls land in localStorage __idTokenCalls.
      signInWithIdToken:function(o){ o=o||{}; try{ var c=JSON.parse(localStorage.getItem('__idTokenCalls')||'[]'); c.push({provider:o.provider,token:o.token,nonce:o.nonce||null}); localStorage.setItem('__idTokenCalls',JSON.stringify(c)); }catch(e){}
        if (F.idTokenError) return Promise.resolve({data:{session:null,user:null},error:{message:F.idTokenError,status:400,name:'AuthApiError'}});
        session=signedSession(); listeners.forEach(function(cb){ try{ cb('SIGNED_IN',session); }catch(e){} });
        return Promise.resolve({data:{session:session,user:user},error:null}); },
      // Stage 5b: '123456' signs in (SIGNED_IN fires before the call resolves, as Supabase does); anything else is refused.
      verifyOtp:function(o){ o=o||{}; window.__fakeLog.push('auth:verify:'+o.token);
        if (F.verifyThrows) return Promise.reject(new TypeError('Failed to fetch'));
        if (o.token!=='123456') return Promise.resolve({data:{session:null,user:null},error:{message:'Token has expired or is invalid',code:'otp_expired',status:403,name:'AuthApiError'}});
        session=signedSession(); listeners.forEach(function(cb){ try{ cb('SIGNED_IN',session); }catch(e){} });
        return new Promise(function(r){ setTimeout(function(){ r({data:{session:session,user:user},error:null}); }, F.verifyDelay||0); }); },
      signInWithPassword:function(){ return Promise.resolve({data:{},error:{message:'Invalid login credentials'}}); },
      refreshSession:function(){ return Promise.resolve({data:{session:session},error:null}); },
      exchangeCodeForSession:function(){ return Promise.resolve({data:{session:session},error:null}); },
      setSession:function(){ return Promise.resolve({data:{session:session},error:null}); },
      updateUser:function(){ return Promise.resolve({data:{user:user},error:null}); }
    }
  };
  window.certanvilSupabase = client;
  // test hook: replay an auth event to every subscriber (SIGNED_OUT passes no session)
  window.__fakeEmit = function(ev){ listeners.forEach(function(cb){ try{ cb(ev, ev==='SIGNED_OUT' ? null : session); }catch(e){} }); };
  window.certanvilSupabaseConfig = { url:'https://fake.invalid', cookieDomain:null, storageKey:null };
  window.__FAKE_PROFILE = profile;
})();
