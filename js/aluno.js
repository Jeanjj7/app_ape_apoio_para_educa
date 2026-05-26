// ------------------------------

        // Verificar sessão ao carregar a página
        
        window.addEventListener('DOMContentLoaded', async () => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                await carregarDadosUsuario(session.user);
                // Also check if type matches? Not strictly needed for now
                if (typeof carregarAulas === 'function') await carregarAulas();
                if (typeof renderizarAgenda === 'function') await renderizarAgenda();
            } else {
                window.location.href = 'loginAluno.html';
            }
        });
    

        

        async function carregarDadosUsuario(user) {
            // Buscar dados do perfil
            const { data: perfil, error } = await supabaseClient
                .from('perfis')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Erro ao carregar perfil:", error);
            }

            const nomeExibicao = perfil?.nome || user.email.split('@')[0];
            const dificuldade = perfil?.dificuldade_principal || 'Matemática';
            const serie = perfil?.serie || 'Não informada';

            // Atualizar elementos da UI
            const headerName = document.getElementById('header-username');
            if (headerName) headerName.innerText = nomeExibicao;

            const headerAvatar = document.getElementById('header-avatar');
            if (headerAvatar) headerAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nomeExibicao)}`;

            const welcomeText = document.getElementById('dashboard-welcome');
            if (welcomeText) welcomeText.innerText = `Bem-vindo(a), ${nomeExibicao.split(' ')[0]}! 🚀`;

            const diffBadge = document.getElementById('dashboard-dificuldade');
            if (diffBadge) {
                diffBadge.innerHTML = `<i data-lucide="${getIconForMateria(dificuldade)}" size="14"></i> ${dificuldade}`;
            }

            // Preencher form de perfil
            const perfilNomeInput = document.getElementById('perfil-nome');
            if (perfilNomeInput) perfilNomeInput.value = nomeExibicao;

            const perfilEmailInput = document.getElementById('perfil-email');
            if (perfilEmailInput) perfilEmailInput.value = user.email;

            const perfilDiffSelect = document.getElementById('perfil-dificuldade');
            if (perfilDiffSelect) perfilDiffSelect.value = dificuldade;

            const perfilSerieInput = document.getElementById('perfil-serie');
            if (perfilSerieInput) perfilSerieInput.value = serie;

            const perfilFoto = document.getElementById('perfil-foto');
            if (perfilFoto) perfilFoto.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nomeExibicao)}`;

            // Exibir a tela principal
            document.getElementById('auth-container').classList.add('hidden-section');
            document.getElementById('app-wrapper').classList.remove('hidden-section');
            lucide.createIcons();

            // Carregar aulas
            await carregarAulas();
        }

        
        

        

        async function handleLogout() {
            await supabaseClient.auth.signOut();
            document.getElementById('auth-container').classList.remove('hidden-section');
            document.getElementById('app-wrapper').classList.add('hidden-section');
            window.location.href = 'loginAluno.html';
        }

        async function carregarAulas() {
            const container = document.getElementById('lista-aulas-container');
            container.innerHTML = '<div class="text-center py-10"><div class="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto"></div></div>';

            const { data: aulas, error } = await supabaseClient
                .from('aulas')
                .select('*, perfis(nome)')
                .order('data', { ascending: true });

            const proxHorario = document.getElementById('proxima-aula-horario');
            const proxTitulo = document.getElementById('proxima-aula-titulo');
            const proxProf = document.getElementById('proxima-aula-prof');
            const proxLink = document.getElementById('proxima-aula-link');

            if (error || !aulas || aulas.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p class="text-slate-400 font-medium">Nenhuma aula disponível no momento.</p>
                    </div>
                `;
                if (proxHorario && proxTitulo && proxProf && proxLink) {
                    proxHorario.innerText = "Sem aulas agendadas";
                    proxTitulo.innerText = "Bons estudos!";
                    proxProf.innerHTML = `<i data-lucide="user" size="16"></i> Acompanhe sua agenda`;
                    proxLink.classList.add('hidden');
                }
                return;
            }

            // Atualizar Próxima Aula no Dashboard
            const proxima = aulas[0];
            if (proxima && proxHorario && proxTitulo && proxProf && proxLink) {
                const dia = proxima.data.split('-')[2];
                const mes = getNomeMes(proxima.data.split('-')[1]);
                proxHorario.innerText = `${dia} de ${mes} • ${proxima.inicio} às ${proxima.fim}`;
                proxTitulo.innerText = proxima.titulo;
                proxProf.innerHTML = `<i data-lucide="user" size="16"></i> Prof(a). ${proxima.perfis?.nome || 'Voluntário'} • ${proxima.materia}`;
                proxLink.href = proxima.meet_url;
                proxLink.classList.remove('hidden');
            }

            container.innerHTML = aulas.map(aula => {
                const dia = aula.data.split('-')[2];
                const mes = getNomeMes(aula.data.split('-')[1]);
                const borderClass = getBorderColor(aula.materia);
                const colorClass = getTextColor(aula.materia);
                const bgClass = getBgColor(aula.materia);

                return `
                <div class="item-card p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 ${borderClass}">
                    <div class="flex items-start gap-4">
                        <div class="${bgClass} ${colorClass} p-4 rounded-2xl mt-1">
                            <div class="text-center leading-tight">
                                <span class="block text-xl font-black">${dia}</span>
                                <span class="block text-[10px] font-bold uppercase tracking-widest">${mes}</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-[10px] font-black uppercase ${colorClass} tracking-widest ${bgClass} px-2 py-1 rounded-md">${aula.materia}</span>
                            <h4 class="text-lg font-black text-slate-900 mt-2">${aula.titulo}</h4>
                            <p class="text-sm text-slate-500 mb-2">Prof(a). ${aula.perfis?.nome || 'Voluntário'}</p>
                            <div class="flex gap-4">
                                <span class="text-xs text-slate-500 font-medium flex items-center gap-1.5"><i data-lucide="clock" size="14" class="text-slate-400"></i> ${aula.inicio} - ${aula.fim}</span>
                            </div>
                        </div>
                    </div>
                    <a href="${aula.meet_url}" target="_blank" class="w-full md:w-auto text-center bg-sky-50 text-sky-600 border border-sky-100 px-6 py-3 rounded-xl text-sm font-black hover:bg-sky-500 hover:text-white transition-all">
                        PARTICIPAR AGORA
                    </a>
                </div>
                `;
            }).join('');

            lucide.createIcons();
        }

        function getNomeMes(mesNum) {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return meses[parseInt(mesNum, 10) - 1] || 'Mês';
        }

        // Estilos e classes
        function getBorderColor(materia) {
            const map = { 'Matemática': 'border-left-math', 'Português': 'border-left-port', 'Inglês': 'border-left-eng', 'História': 'border-left-hist', 'Redação': 'border-left-red' };
            return map[materia] || 'border-left-eng';
        }

        function getTextColor(materia) {
            const map = { 'Matemática': 'text-red-500', 'Português': 'text-yellow-600', 'Inglês': 'text-blue-500', 'História': 'text-purple-500', 'Redação': 'text-green-500' };
            return map[materia] || 'text-slate-500';
        }

        function getBgColor(materia) {
            const map = { 'Matemática': 'bg-red-50', 'Português': 'bg-yellow-50', 'Inglês': 'bg-blue-50', 'História': 'bg-purple-50', 'Redação': 'bg-green-50' };
            return map[materia] || 'bg-slate-50';
        }

        function getIconForMateria(materia) {
            const map = {
                'matematica': 'calculator',
                'Matemática': 'calculator',
                'portugues': 'languages',
                'Português': 'languages',
                'ingles': 'globe',
                'Inglês': 'globe',
                'historia': 'landmark',
                'História': 'landmark',
                'redacao': 'pen-tool',
                'Redação': 'pen-tool'
            };
            return map[materia] || 'book-open';
        }

        function showSection(sectionId) {
            ['dashboard', 'aulas', 'materiais', 'quizzes', 'perfil'].forEach(id => {
                const sec = document.getElementById('section-' + id);
                if (sec) sec.classList.add('hidden-section');
            });
            
            const selectedSec = document.getElementById('section-' + sectionId);
            if (selectedSec) selectedSec.classList.remove('hidden-section');
            
            document.querySelectorAll('.nav-item').forEach(i => {
                i.classList.remove('active-nav', 'bg-slate-50');
                i.classList.add('text-slate-500');
            });
            
            const activeNav = document.getElementById('nav-' + sectionId);
            if(activeNav) {
                activeNav.classList.add('active-nav');
                activeNav.classList.remove('text-slate-500');
            }

            lucide.createIcons();
        }

        function showFeedbackModal(type, title, msg) {
            const modal = document.getElementById('success-modal');
            const iconContainer = document.getElementById('modal-icon-container');
            const titleEl = document.getElementById('modal-title');
            const msgEl = document.getElementById('success-msg');
            
            if (titleEl) titleEl.innerText = title;
            if (msgEl) msgEl.innerText = msg;

            if (iconContainer) {
                if (type === 'success') {
                    iconContainer.className = "w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6";
                    iconContainer.innerHTML = '<i data-lucide="check-circle-2" size="40"></i>';
                } else {
                    iconContainer.className = "w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6";
                    iconContainer.innerHTML = '<i data-lucide="x-circle" size="40"></i>';
                }
            }
            
            lucide.createIcons();
            if (modal) modal.classList.remove('hidden-section');
        }

        function showSuccessModal(msg) {
            showFeedbackModal('success', 'Perfeito!', msg);
        }

        function closeModal() {
            const modal = document.getElementById('success-modal');
            if (modal) modal.classList.add('hidden-section');
        }

        function atualizarFotoPerfil(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const perfilFoto = document.getElementById('perfil-foto');
                    const headerAvatar = document.getElementById('header-avatar');
                    if (perfilFoto) perfilFoto.src = e.target.result;
                    if (headerAvatar) headerAvatar.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }

        async function salvarPerfil(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
            btn.disabled = true;

            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                showFeedbackModal('error', 'Erro', 'Usuário não autenticado.');
                btn.innerHTML = originalContent;
                btn.disabled = false;
                return;
            }

            const nome = document.getElementById('perfil-nome').value;
            const dificuldade = document.getElementById('perfil-dificuldade').value;
            const serie = document.getElementById('perfil-serie').value;

            const { error } = await supabaseClient
                .from('perfis')
                .update({
                    nome: nome,
                    serie: serie,
                    dificuldade_principal: dificuldade
                })
                .eq('id', user.id);

            if (error) {
                showFeedbackModal('error', 'Erro ao salvar', error.message);
            } else {
                showFeedbackModal('success', 'Perfil updated!', 'Suas alterações foram salvas com sucesso.');
                await carregarDadosUsuario(user);
            }

            btn.innerHTML = originalContent;
            btn.disabled = false;
        }

        // Simulação do Quiz
        window.iniciarQuiz = function() {
            const modal = document.getElementById('quiz-modal');
            if (modal) modal.classList.remove('hidden-section');
        }

        window.fecharQuiz = function() {
            const modal = document.getElementById('quiz-modal');
            if (modal) modal.classList.add('hidden-section');
        }

        window.finalizarQuiz = function() {
            const selected = document.querySelector('input[name="q1"]:checked');
            fecharQuiz();
            
            if (!selected) {
                showFeedbackModal('error', 'Atenção', 'Você não selecionou nenhuma resposta!');
                return;
            }

            if (selected.value === 'correct') {
                showFeedbackModal('success', 'Parabéns!', 'Você acertou em cheio! A fórmula de Bhaskara é x = (-b ± √(b² - 4ac)) / 2a.');
            } else {
                showFeedbackModal('error', 'Poxa, não foi dessa vez...', 'A resposta correta era a Letra A. Não desista, continue estudando e tentando!');
            }
        }

        // Simulação do Vídeo
        function abrirVideo(url) {
            const modal = document.getElementById('video-modal');
            const iframe = document.getElementById('video-iframe');
            if (iframe) iframe.src = url;
            if (modal) modal.classList.remove('hidden-section');
        }

        function fecharVideo() {
            const modal = document.getElementById('video-modal');
            const iframe = document.getElementById('video-iframe');
            if (modal) modal.classList.add('hidden-section');
            if (iframe) iframe.src = "";
        }
        window.handleLogout = handleLogout;
        window.showSection = showSection;
        window.showFeedbackModal = showFeedbackModal;
        window.showSuccessModal = showSuccessModal;
        window.closeModal = closeModal;
        window.abrirVideo = abrirVideo;
        window.fecharVideo = fecharVideo;
        window.salvarPerfil = salvarPerfil;
        window.atualizarFotoPerfil = atualizarFotoPerfil;
});
