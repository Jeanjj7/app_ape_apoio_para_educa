
        window.addEventListener('DOMContentLoaded', async () => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                window.location.href = 'voluntario.html';
            }
        });
    
window.handleLoginReal = async function(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalContent = btn.innerHTML;
            
            btn.innerHTML = '<div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
            btn.disabled = true;

            const email = e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                alert('Erro no Login: ' + error.message);
                btn.innerHTML = originalContent;
                btn.disabled = false;
            } else {
                window.location.href = 'voluntario.html';
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        }
window.handleSignupReal = async function(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
            btn.disabled = true;

            const inputsText = e.target.querySelectorAll('input[type="text"]');
            const nome = inputsText[0].value;
            const email = e.target.querySelector('input[type="email"]').value;
            
            let disciplina = '';
            document.querySelectorAll('.discipline-card').forEach(radio => {
                if(radio.checked) disciplina = radio.value;
            });

            const senhas = e.target.querySelectorAll('input[type="password"]');
            const pass1 = senhas[0].value;
            const pass2 = senhas[1].value;

            if (pass1 !== pass2) {
                alert('As senhas não coincidem!');
                btn.innerHTML = originalContent;
                btn.disabled = false;
                return;
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: pass1,
            });

            if (error) {
                alert('Erro no Cadastro: ' + error.message);
                btn.innerHTML = originalContent;
                btn.disabled = false;
            } else {
                if (data.user) {
                    const { error: dbError } = await supabaseClient.from('perfis').insert({
                        id: data.user.id,
                        nome: nome,
                        tipo: 'voluntario',
                        email: email,
                        formacao: disciplina
                    });
                    if (dbError) {
                        console.error("Erro ao criar perfil:", dbError);
                        alert('Conta criada, mas erro ao salvar perfil: ' + dbError.message);
                        btn.innerHTML = originalContent;
                        btn.disabled = false;
                        return;
                    }
                }
                alert('Conta criada com sucesso! Faça login.');
                window.location.href = 'loginVoluntario.html';
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        }
