import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth-service';
import { EngagementService } from '../../../core/data/engagement-service';
import { Engagement, EngagementDocument } from '../../../core/data/models';
import { TeamService } from '../../../core/data/team-service';
import { toIsoDate } from '../../../core/util/dates';
import { Icon } from '../../../shared/icon/icon';
import { ToastService } from '../../../shared/toast/toast-service';

const ALLOWED = ['pdf', 'docx', 'xlsx', 'csv'];
const MAX_MB = 25;

@Component({
  selector: 'app-documents-tab',
  imports: [DatePipe, DecimalPipe, Icon],
  template: `
    <div class="head">
      <div>
        <h2 class="section-title">Engagement documents</h2>
        <p class="caption">{{ docs().length }} files · {{ totalMb() | number: '1.0-1' }} MB · Assigned team access</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="fileInput.click()">
        <app-icon name="upload" /> Upload Document
      </button>
      <input #fileInput type="file" hidden [accept]="accept" (change)="onFile($event)" />
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">File</th>
            <th scope="col">Uploaded by</th>
            <th scope="col" aria-sort="descending">Upload date ↓</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (d of docs(); track d.id) {
            <tr>
              <td>
                <div class="file">
                  <app-icon name="file" [size]="20" />
                  <div>
                    <strong>{{ d.name }}</strong>
                    <span class="caption">{{ d.type }} · {{ size(d.sizeKb) }}</span>
                  </div>
                </div>
              </td>
              <td>{{ team.name(d.uploadedById) }}</td>
              <td class="nowrap">{{ d.uploadedAt | date: 'MMM dd, y' }}</td>
              <td>
                <button type="button" class="btn btn-secondary btn-sm" (click)="download(d)" [attr.aria-label]="'Download ' + d.name">
                  Download
                </button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="4" class="muted">{{ loaded() ? 'No documents yet.' : 'Loading…' }}</td></tr>
          }
        </tbody>
      </table>
    </div>
    <p class="caption footnote">
      PDF, DOCX, XLSX, and CSV · Maximum {{ maxMb }} MB per file. Do not upload passwords or files containing unredacted personal identifiers.
    </p>
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-6); }
    .file { display: flex; align-items: center; gap: var(--space-3); }
    .file app-icon { color: var(--color-primary); }
    .file strong { display: block; font-weight: 500; }
    .nowrap { white-space: nowrap; }
    .footnote { margin-top: var(--space-6); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsTab {
  private readonly engagements = inject(EngagementService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly team = inject(TeamService);

  readonly engagement = input.required<Engagement>();

  protected readonly accept = ALLOWED.map((ext) => '.' + ext).join(',');
  protected readonly maxMb = MAX_MB;

  private readonly reload = signal(0);
  protected readonly loaded = toSignal(
    combineLatest([toObservable(this.engagement), toObservable(this.reload)]).pipe(
      switchMap(([e]) => this.engagements.documentsFor(e.id)),
    ),
  );
  protected readonly docs = computed(() => this.loaded() ?? []);
  protected readonly totalMb = computed(() => this.docs().reduce((s, d) => s + d.sizeKb, 0) / 1024);

  protected size(kb: number): string {
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }

  /** Mock upload: validates the file, then saves only its metadata to the API. */
  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED.includes(ext)) {
      this.toast.show('Only PDF, DOCX, XLSX, and CSV files are allowed.', 'error');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      this.toast.show(`Files must be ${MAX_MB} MB or smaller.`, 'error');
      return;
    }

    this.engagements
      .addDocument({
        engagementId: this.engagement().id,
        name: file.name,
        type: ext.toUpperCase(),
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        uploadedById: this.auth.user()?.id ?? 'u1',
        uploadedAt: toIsoDate(new Date()),
      })
      .subscribe(() => {
        this.reload.update((v) => v + 1);
        this.toast.show(`Uploaded ${file.name}`);
      });
  }

  protected download(d: EngagementDocument): void {
    this.toast.show(`Demo app: ${d.name} isn't stored, so there's nothing to download.`, 'info');
  }
}
